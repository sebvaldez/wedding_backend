const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const GroupService = require('/opt/nodejs/services/groupService');
const groupService = new GroupService(process.env.MEMBER_TABLE);

// Constants
const MEMBER_PREFIX = "MEMBER#";
const GROUP_PREFIX = "GROUP#";
const NON_GROUP_STATUS = "GROUP#NO_GROUP";

class MemberService {
  constructor(tableName, gsiName) {
    this.tableName = tableName;
    this.gsiName = gsiName;
  }

  async createMember(member) {
    const memberId = uuidv4();
    const timestamp = new Date().toISOString();

    const putParams = {
      TableName: this.tableName,
      Item: {
        PK: `MEMBER#${memberId}`,
        SK: `GROUP#${member.groupId || 'NO_GROUP'}`,
        GSI1PK: `EMAIL#${member.email}`,
        GSI1SK: `MEMBER#${memberId}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...member
      }
    };
    try {
      await dynamoDB.put(putParams).promise();
      return memberId;
    } catch(err) {
      console.error('MemberService#createMember Error: ', err);
      throw err;
    }
  }

  async createMembersInBulk(members) {
    if (!Array.isArray(members) || members.length === 0) {
        throw new Error('Input should be a non-empty array of members.');
    }

    const timestamp = new Date().toISOString();

    // Prepare the items for batch write
    const items = members.map(member => {
        const memberId = uuidv4();
        return {
            PutRequest: {
                Item: {
                    PK: `MEMBER#${memberId}`,
                    SK: `GROUP#${member.groupId || 'NO_GROUP'}`,
                    GSI1PK: `EMAIL#${member.email}`,
                    GSI1SK: `MEMBER#${memberId}`,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    ...member
                }
            }
        };
    });

    const params = {
        RequestItems: {
            [this.tableName]: items
        }
    };

    try {
        await dynamoDB.batchWrite(params).promise();
        return { success: true, message: 'Members created successfully.' };
    } catch (err) {
        console.error('Error in createMembersInBulk:', err);
        throw err;
    }
  }

  async deleteMember(memberId) {
    if (!memberId) {
        throw new Error('memberId is required to delete a member.');
    }

    const queryParams = {
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
            ":pk": `MEMBER#${memberId}`
        }
    };

    try {
        const result = await dynamoDB.query(queryParams).promise();
        if (result.Items && result.Items.length > 0) {
            const deleteParams = {
                TableName: this.tableName,
                Key: {
                    PK: result.Items[0].PK,
                    SK: result.Items[0].SK
                }
            };
            await dynamoDB.delete(deleteParams).promise();
            return { success: true, message: 'Member deleted successfully.' };
        } else {
            return { success: false, message: 'Member not found.' };
        }
    } catch (err) {
        console.error('RSVPService deleteMember Error: ', err);
        throw err;
    }
  }

  async fetchAll() {
    const scanParams = {
        TableName: this.tableName,
        FilterExpression: "begins_with(PK, :pkValue)",
        ExpressionAttributeValues: {
            ":pkValue": "MEMBER#"
        }
    };

    try {
        const result = await dynamoDB.scan(scanParams).promise();
        return result.Items;
    } catch (err) {
        console.error('Error in fetchAll method:', err);
        throw err;
    }
  }

  async getMemberByEmail(email) {
    return this._where({
        GSI1PK: `EMAIL#${email}`
    });
  }

  async getMemberByMemberId(memberId) {
    return this._where({
        PK: `MEMBER#${memberId}`
    });
  }

  async updateMember(memberId, updates) {
    this.validateUpdateParams(memberId, updates);

    const fetchedMember = await this.fetchMember(memberId);
    const newGroupId = updates.groupId;
    delete updates.groupId;  // Remove groupId from updates

    if (newGroupId && fetchedMember.SK !== `${GROUP_PREFIX}${newGroupId}`) {
      // Handle group related logic
      return await this.handleGroup(memberId, newGroupId, fetchedMember, updates);
    } else {
      return await this.performRegularUpdate(memberId, fetchedMember.SK, updates);
    }
  }

  async fetchMember(memberId) {
    const currentMember = await this.getMemberByMemberId(memberId);
    if (!currentMember || !currentMember[0]) {
        throw new Error('Member not found.');
    }
    return currentMember[0];
  }

  async handleGroup(memberId, newGroupId, fetchedMember, updates) {
    // Check if the member was previously in a group
    if (fetchedMember.SK.startsWith(GROUP_PREFIX) && fetchedMember.SK !== NON_GROUP_STATUS) {
        // The member was previously in a group, decrement the old group size
        const oldGroupId = fetchedMember.SK.split('#')[1];
        if (oldGroupId) {
            await groupService.decrementGroupSize(oldGroupId);
        }
    }

    // If the member is being moved to a new group, handle the SK change
    const updatedUser = await this.handleSKChange(memberId, fetchedMember, newGroupId, updates);

    // If the member is being added to a new group, increment the group size
    await groupService.incrementGroupSize(newGroupId);

    return updatedUser;
  }

  async handleSKChange(memberId, fetchedMember, newGroupId, updates) {
    const deleteParams = this.getDeleteParams(memberId, fetchedMember.SK);
    const putParams = this.getPutParams(fetchedMember, `${GROUP_PREFIX}${newGroupId}`, updates);
    const transactParams = {
        TransactItems: [
            { Delete: deleteParams },
            { Put: putParams }
        ]
    };

    try {
        await dynamoDB.transactWrite(transactParams).promise();
        return putParams.Item;
    } catch (err) {
        console.error('Error in handleSKChange:', err);
        throw err;
    }
  }

  async performRegularUpdate(memberId, currentSK, updates) {
    const updateParams = this.getUpdateParams(memberId, currentSK, updates);
    try {
        const result = await dynamoDB.update(updateParams).promise();
        return result.Attributes;
    } catch (err) {
        console.error('Error in performRegularUpdate:', err);
        throw err;
    }
  }

  // Helper for MemberService
  async validateUpdateParams(memberId, updates) {
    if (!memberId || !updates || Object.keys(updates).length === 0) {
        throw new Error('Both memberId and updates are required.');
    }
    // Remove attributes that should not be updated
    const nonUpdatableAttributes = ['PK', 'SK', 'id', 'GSI1PK', 'GSI1SK', 'createdAt', 'updatedAt'];
    nonUpdatableAttributes.forEach(attr => delete updates[attr]);

    // Check if groupId exists and validate it
    if (updates.groupId) {
      const isValidGroup = await groupService.validGroup(updates.groupId);
      if (!isValidGroup) {
          throw new Error(`Invalid groupId: ${updates.groupId}`);
      }
    }
  }

  getUpdateParams(memberId, currentSK, updates) {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    for (const [key, value] of Object.entries(updates)) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
        expressionAttributeNames[`#${key}`] = key;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    return {
        TableName: this.tableName,
        Key: {
            PK: `${MEMBER_PREFIX}${memberId}`,
            SK: currentSK
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW'
    };
  }

  getDeleteParams(memberId, currentSK) {
    return {
        TableName: this.tableName,
        Key: {
            PK: `${MEMBER_PREFIX}${memberId}`,
            SK: currentSK
        }
    };
  }

  getPutParams(fetchedMember, newSK, updates) {
      return {
          TableName: this.tableName,
          Item: {
              ...fetchedMember,
              SK: newSK,
              ...updates,
              updatedAt: new Date().toISOString()
          }
      };
  }

  // Private method
  async _where(query) {
    const queryParams = {
        TableName: this.tableName,
        KeyConditionExpression: "",
        ExpressionAttributeValues: {}
    };

    let firstConditionSet = false;

    if (query.PK) {
        queryParams.KeyConditionExpression += "PK = :pk";
        queryParams.ExpressionAttributeValues[":pk"] = query.PK;
        firstConditionSet = true;
    }

    if (query.SK) {
        if (firstConditionSet) {
            queryParams.KeyConditionExpression += " AND ";
        }
        queryParams.KeyConditionExpression += "SK = :sk";
        queryParams.ExpressionAttributeValues[":sk"] = query.SK;
    }

    // Handle GSI1PK
    if (query.GSI1PK) {
      queryParams.IndexName = this.gsiName;
      queryParams.KeyConditionExpression = "GSI1PK = :gsi1pk";
      queryParams.ExpressionAttributeValues[":gsi1pk"] = query.GSI1PK;
    }

    try {
        const result = await dynamoDB.query(queryParams).promise();
        return result.Items;
    } catch (err) {
        console.error('Error in _where method:', err);
        throw err;
    }
  }
}

module.exports = MemberService;

const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

class MemberService {
  constructor(tableName, gsiName) {
    this.tableName = tableName;
    this.gsiName = gsiName;
  }

  async createMember(member) {
    const memberId = uuidv4();

    const putParams = {
      TableName: this.tableName,
      Item: {
        PK: `MEMBER#${memberId}`,
        SK: `GROUP#${member.group_id || 'NO_GROUP'}`,
        GSI1PK: `EMAIL#${member.email}`,
        GSI1SK: `MEMBER#${memberId}`,
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

    // Prepare the items for batch write
    const items = members.map(member => {
        const memberId = uuidv4();
        return {
            PutRequest: {
                Item: {
                    PK: `MEMBER#${memberId}`,
                    SK: `GROUP#${member.group_id || 'NO_GROUP'}`,
                    GSI1PK: `EMAIL#${member.email}`,
                    GSI1SK: `MEMBER#${memberId}`,
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
        TableName: this.tableName
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
    if (!memberId || !updates || Object.keys(updates).length === 0) {
        throw new Error('Both memberId and updates are required.');
    }

    // Remove attributes that should not be updated
    delete updates.PK;
    delete updates.SK;
    delete updates.ID;
    delete updates.GSI1PK;
    delete updates.GSI1SK;

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Constructing the update expressions and attribute values
    for (const [key, value] of Object.entries(updates)) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
        expressionAttributeNames[`#${key}`] = key;
    }

    const updateParams = {
        TableName: this.tableName,
        Key: {
            PK: `MEMBER#${memberId}`,
            // Assuming you have a sort key, but if not, remove this line
            SK: `GROUP#${updates.group_id || 'NO_GROUP'}`
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW'  // Returns the updated item
    };

    try {
        const result = await dynamoDB.update(updateParams).promise();
        return result.Attributes;
    } catch (err) {
        console.error('Error in updateMember method:', err);
        throw err;
    }
  }


  async updateMemberInBulk(memberUpdates) {
    // Implementation here
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

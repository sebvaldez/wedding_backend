// groupService.js

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

class GroupService {
    constructor(tableName) {
        this.tableName = tableName;
    }
    async validGroup(groupId) {
        const params = {
            TableName: this.tableName,
            Key: {
                PK: `GROUP#${groupId}`,
                SK: `GROUP#${groupId}`
            }
        };

        try {
            const result = await dynamoDB.get(params).promise();
            return !!result.Item;  // Returns true if the group exists, false otherwise
        } catch (err) {
            console.error('Error in validGroup method:', err);
            throw err;
        }
    }

    async createGroup(groupData) {
        const groupId = uuidv4();
        const timestamp = new Date().toISOString();

        const groupItem = {
            PK: `GROUP#${groupId}`,
            SK: `GROUP#${groupId}`,
            name: groupData.name,
            createdAt: timestamp,
            updatedAt: timestamp,
            groupSize: 0
        };

        const params = {
            TableName: this.tableName,
            Item: groupItem
        };

        await dynamoDB.put(params).promise();
        return groupItem;
    }

    async listGroups() {
        const scanParams = {
            TableName: this.tableName,
            FilterExpression: "begins_with(PK, :pkValue)",
            ExpressionAttributeValues: {
                ":pkValue": "GROUP#"
            }
        };

        try {
            const result = await dynamoDB.scan(scanParams).promise();
            return result.Items;
        } catch (err) {
            console.error('Error in listGroups method:', err);
            throw err;
        }
    }

    async incrementGroupSize(groupId) {
        const params = {
            TableName: this.tableName,
            Key: {
                PK: `GROUP#${groupId}`,
                SK: `GROUP#${groupId}`
            },
            UpdateExpression: "SET groupSize = groupSize + :inc",
            ExpressionAttributeValues: {
                ":inc": 1
            },
            ReturnValues: "UPDATED_NEW"
        };

        try {
            await dynamoDB.update(params).promise();
        } catch (err) {
            console.error('Error in incrementGroupSize method:', err);
            throw err;
        }
    }

    async decrementGroupSize(groupId) {
        const params = {
            TableName: this.tableName,
            Key: {
                PK: `GROUP#${groupId}`,
                SK: `GROUP#${groupId}`
            },
            UpdateExpression: "SET groupSize = groupSize - :dec",
            ExpressionAttributeValues: {
                ":dec": 1
            },
            ReturnValues: "UPDATED_NEW"
        };

        try {
            await dynamoDB.update(params).promise();
        } catch (err) {
            console.error('Error in decrementGroupSize method:', err);
            throw err;
        }
    }
}

module.exports = GroupService;

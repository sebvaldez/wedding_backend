// groupService.js

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

class GroupService {
    constructor(tableName) {
        this.tableName = tableName;
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
}

module.exports = GroupService;

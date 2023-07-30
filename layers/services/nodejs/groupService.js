'use-strict'

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

class GroupService {
  constructor(tableName) {
    this.tableName = tableName
  }
  // async createGroup
  // async updateGroup
  // async deleteGroup

}

module.exports = GroupService
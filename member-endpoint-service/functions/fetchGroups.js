// fetchGroups.js

'use strict';

const GroupService = require('/opt/nodejs/services/groupService');
const groupService = new GroupService(process.env.MEMBER_TABLE);
const GroupDTO = require('/opt/nodejs/dtos/groupDTO');

module.exports.call = async (event, context, callback) => {
    
    try {
        const groups = await groupService.listGroups();
        const transformedGroups = GroupDTO.transformList(groups);  // Assuming you have a transformList method in DTO

        return {
            statusCode: 202,
            body: JSON.stringify(transformedGroups)
        };
    } catch (error) {
        console.error('Error listing groups:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

// createGroup.js

'use strict';

const GroupService = require('/opt/nodejs/groupService');
const groupService = new GroupService(process.env.MEMBER_TABLE);
const GroupDTO = require('/opt/nodejs/groupDTO');

module.exports.call = async (event) => {
    try {
        const groupData = JSON.parse(event.body);
        const newGroup = await groupService.createGroup(groupData);
        const transformedGroup = GroupDTO.transform(newGroup);

        return {
            statusCode: 201,
            body: JSON.stringify(transformedGroup)
        };
    } catch (error) {
        console.error('Error creating group:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

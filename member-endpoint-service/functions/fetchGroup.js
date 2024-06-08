// fetchGroup.js

'use strict';

// import group service and gorup dto
const GroupService = require('/opt/nodejs/services/groupService');
const groupService = new GroupService(process.env.MEMBER_TABLE);
const GroupDTO = require('/opt/nodejs/dtos/groupDTO');

module.exports.call = async (event, context, callback) => {
  // get id from path parameter, validate and handle errors
  const groupId = event.pathParameters.groupId;
  if (!groupId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing groupId' })
    };
  }
  // use group service to fetch group by id via fetchGroup method
  try {
    const group = await groupService.getGroup(groupId);
    const transformedGroup = GroupDTO.transform(group);

    return {
      statusCode: 200,
      body: JSON.stringify(transformedGroup)
    };
  } catch (error) {
    console.error('Error fetching group:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};

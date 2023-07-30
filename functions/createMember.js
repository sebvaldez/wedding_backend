'use strict';

const MemberService = require('/opt/nodejs/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);

module.exports.call = async (event) => {
  const create_member_params = JSON.parse(event.body);

  // Check if the provided params are empty or not provided
  if (!create_member_params || Object.keys(create_member_params).length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Create member params required.' }),
    };
  }

  try {
    const memberId = await memberService.createMember(create_member_params);
    return {
      statusCode: 201,  // Updated status code to indicate resource creation
      body: JSON.stringify({ id: memberId, ...create_member_params, created: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: err })
    };
  }
};

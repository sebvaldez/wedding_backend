'use strict';
const middy = require('@middy/core');
const cors = require('@middy/http-cors');

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');

const fetchMemberLogic = async (event) => {
  let member;

  if (event.queryStringParameters?.id) {
      member = await memberService.getMemberByMemberId(event.queryStringParameters.id);
  } else if (event.queryStringParameters?.email) {
      member = await memberService.getMemberByEmail(event.queryStringParameters.email);
  } else {
      member = await memberService.fetchAll();
  }

  const members = Array.isArray(member) ? member : [member];
  const validMembers = members.filter(Boolean);

  if (validMembers.length === 0) {
      return {
          statusCode: 404,
          body: JSON.stringify({ message: 'No members found.' })
      };
  }

  const transformedMembers = MemberDTO.transformList(validMembers);
  return {
      statusCode: 200,
      body: JSON.stringify(transformedMembers)
  };
};

const handler = middy(fetchMemberLogic)
    .use(cors({
        origin: '*',
        credentials: true,
        headers: '*'
    }))

module.exports.call = handler;


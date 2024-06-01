// fetchGroupMembers.js

'use strict';
const middy = require('@middy/core');
const cors = require('@middy/http-cors');

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');

const fetchGroupMembersLogic = async (event) => {
    // get group id from path wedding/groups/{groupId}/members
    const groupId = event.pathParameters.groupId;

    if (!groupId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing group id' })
        };
    }

    const members = await memberService.fetchMembersByGroupId(groupId);
    const transformedMembers = MemberDTO.transformList(members);

    return {
        statusCode: 200,
        body: JSON.stringify(transformedMembers)
    };

};

const handler = middy(fetchGroupMembersLogic)
    .use(cors({
        origin: '*',
        credentials: true,
        headers: '*'
    }))

module.exports.call = handler;

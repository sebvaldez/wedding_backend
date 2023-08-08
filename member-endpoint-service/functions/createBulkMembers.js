'use strict';
const middy = require('@middy/core');
const cors = require('@middy/http-cors');

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);

const createBulkMemberLogic = async (event) => {
    const create_member_params = JSON.parse(event.body);

    // Validate the input
    if (!Array.isArray(create_member_params) || create_member_params.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Input should be a non-empty array of members.' })
        };
    }

    try {
        const result = await memberService.createMembersInBulk(create_member_params);
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (err) {
        console.error('Error in create bulk members lambda:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: err.message })
        };
    }
};

const handler = middy(createBulkMemberLogic)
    .use(cors({
        origin: '*',
        credentials: true,
        headers: '*'
    }))

module.exports.call = handler;

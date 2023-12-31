'use strict';
const middy = require('@middy/core');
const cors = require('@middy/http-cors');

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);

const deleteMemberLogic = async (event) => {
    const request_params = event.pathParameters;

    // Assuming your path parameter contains memberId like /members/{memberId}
    const memberId = request_params.memberId;

    if (!memberId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'memberId is required.' }),
        };
    }

    try {
        const result = await memberService.deleteMember(memberId);
        if (result.success) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: result.message }),
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: result.message }),
            };
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

const handler = middy(deleteMemberLogic)
    .use(cors({
        origin: '*',
        credentials: true,
        headers: '*'
    }))

module.exports.call = handler;

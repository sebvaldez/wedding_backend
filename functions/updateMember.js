'use strict';

const MemberService = require('/opt/nodejs/services/memberService');
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);

module.exports.call = async (event) => {
    const memberId = event.pathParameters.memberId;  // Assuming you're passing the memberId as a path parameter
    const updates = JSON.parse(event.body);

    // Validate input
    if (!memberId || !updates || Object.keys(updates).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Both memberId and updates are required.' })
        };
    }

    try {
        const updatedMember = await memberService.updateMember(memberId, updates);
        const transformedMember = MemberDTO.transform(updatedMember);
        return {
            statusCode: 200,
            body: JSON.stringify(transformedMember)
        };
    } catch (err) {
        console.error('Error in updateMember lambda:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: err.message })
        };
    }
};

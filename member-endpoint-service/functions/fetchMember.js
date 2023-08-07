'use strict';

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');

module.exports.call = async (event, context, callback) => {
    try {
        let member;

        // Check if ID is provided in the query string
        if (event.queryStringParameters?.id) {
            member = await memberService.getMemberByMemberId(event.queryStringParameters.id);
        }
        // Check if Email is provided in the query string
        else if (event.queryStringParameters?.email) {
            member = await memberService.getMemberByEmail(event.queryStringParameters.email);
        }
        // If no query parameters are provided, fetch all members
        else {
            member = await memberService.fetchAll();
        }

        // Ensure the result is an array
        const members = Array.isArray(member) ? member : [member];

        // Filter out any null or undefined members
        const validMembers = members.filter(Boolean);

        // If no valid members are found
        if (validMembers.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No members found.' })
            };
        }

        // Transform the member data using the DTO
        const transformedMembers = MemberDTO.transformList(validMembers);

        // Return the found members
        return {
            statusCode: 200,
            body: JSON.stringify(transformedMembers)
        };

    } catch (error) {
        console.error('Error fetching members:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

'use strict';

const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE, process.env.MEMBER_TABLE_GSI_1);
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');

module.exports.call = async (event) => {
    try {
        const memberUpdates = JSON.parse(event.body);

        // Validate input
        if (!Array.isArray(memberUpdates) || memberUpdates.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'An array of member updates is required.' })
            };
        }

        const updateResults = [];
        for (const update of memberUpdates) {
            const memberId = update.id;
            delete update.id; // Remove the id from the update object

            if (!memberId) {
                updateResults.push({ status: 'failed', message: 'Member ID is missing.' });
                continue;
            }

            try {
                const updatedMember = await memberService.updateMember(memberId, update);
                const transformedMember = MemberDTO.transform(updatedMember);
                updateResults.push({ status: 'success', member: transformedMember });
            } catch (err) {
                console.error(`Error updating member with ID ${memberId}:`, err);
                updateResults.push({ status: 'failed', message: err.message });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(updateResults)
        };

    } catch (error) {
        console.error('Error in UpdateBulkMembers lambda:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

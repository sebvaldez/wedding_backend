'use strict';

const client = require('twilio')(process.env.TWILLIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN);
const MemberService = require('/opt/nodejs/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);

module.exports.call = async (event) => {
  try {
    const memberId = event.pathParameters.memberId;

    if (!memberId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'memberId is required in the path parameters' }),
      };
    }

    // Fetch member details using the memberId
    const members = await memberService.getMemberByMemberId(memberId);
    if (!members || members.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Member not found' }),
      };
    }

    const member = members[0];
    const phoneNumber = member.phoneNumber;
    const firstName = member.firstName;
    const lastName = member.lastName;
    const email = member.email;
    const groupId = member.group_id;

    if (!phoneNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Phone number not found for the member' }),
      };
    }

    // Construct the message
    let message = `Hello ${firstName} ${lastName}, remember to RSVP to Allegra and Sebastian's Wedding at `;
    message += `https://allegrasebwedding.com/rsvp?email=${email}`;
    if (groupId) {
      message += `&group_id=${groupId}`;
    }

    // Send the message using Twilio
    const twillioResp = await client.messages.create({
      from: process.env.TWILLIO_ACCOUNT_NUMBER,
      to: phoneNumber,
      body: message,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ message: `Sent text - ${twillioResp.sid}` }),
    };

  } catch (error) {
    console.error('Error sending Twilio message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

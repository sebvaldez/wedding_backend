const fs = require('fs');
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.REGION });
const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);

module.exports.call = async (event, context, callback) => {
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
    const email = member.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email not found for the member' }),
      };
    }

    const htmlTemplate = fs.readFileSync('/opt/nodejs/email_template.html', 'utf8');

    const emailParams = {
      Destination: {
        ToAddresses: [email] // Send to member's email
      },
      Message: {
        Subject: {
          Data: 'Wedding Site RSVP Test Email'
        },
        Body: {
          Html: {
            Data: htmlTemplate
          }
        }
      },
      Source: process.env.SENDER_EMAIL
    };

    const response = await ses.sendEmail(emailParams).promise();
    return { statusCode: 201, body: JSON.stringify(response, null, 2) };

  } catch (error) {
    console.error('Error in emailMessage lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};

const fs = require('fs');
const middy = require('@middy/core');
const cors = require('@middy/http-cors');
const sgMail = require('@sendgrid/mail');
const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);
const MemberDTO = require('/opt/nodejs/dtos/memberDTO');

// Set the SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailMessageLogic = async (event) => {
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

    const transformedMember = MemberDTO.transform(members[0]);

    const email = transformedMember.email;
    const firstName = transformedMember.firstName;
    const lastName = transformedMember.lastName;
    const groupId = transformedMember.groupId;
    const checkIn = transformedMember.checkIn;
    const emailedInvitation = transformedMember.emailedInvitation;

    //todo handle when email has already been sent / already checked in

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email not found for the member' }),
      };
    }

    const htmlTemplate = fs.readFileSync('/opt/nodejs/email_template.html', 'utf8');

    // Interpolate the member's information into the HTML template
    const personalizedHtmlTemplate = htmlTemplate
      .replace('[Recipient\'s Name]', `${firstName} ${lastName}`)
      .replace('[RSVP Link]', `https://allegrasebwedding.com/rsvp?userId=${memberId}${groupId ? `&groupId=${groupId}` : ''}`);

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: 'RSVP to the Ceseña-Valdez Wedding!',
      html: personalizedHtmlTemplate,
    };

    await sgMail.send(msg);

    return { statusCode: 201, body: JSON.stringify({ message: 'Email sent' }) };

  } catch (error) {
    console.error('Error in emailMessage lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};

const handler = middy(emailMessageLogic)
    .use(cors({
        origin: '*',
        credentials: true
    }));

module.exports.call = handler;

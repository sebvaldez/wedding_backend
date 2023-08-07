const fs = require('fs');
const sgMail = require('@sendgrid/mail');
const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);

// Set the SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    const firstName = member.firstName;
    const lastName = member.lastName;
    const groupId = member.groupId;

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
      .replace('[RSVP Link]', `https://allegrasebwedding.com/rsvp?email=${email}${groupId ? `&groupId=${groupId}` : ''}`);

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: 'Wedding Site RSVP Test Email',
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

'use strict';

const middy = require('@middy/core');
const cors = require('@middy/http-cors');

const ResponseHandler = require('/opt/nodejs/support/responseHandler');
const client = require('twilio')(process.env.TWILLIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN);
const MemberService = require('/opt/nodejs/services/memberService');
const memberService = new MemberService(process.env.MEMBER_TABLE);

const templates = {
  initialInvitation: `Hello {firstName}, it's Sebastian & Allegra!

  The online portal to RSVP for our wedding on September 8, 2024 in Portland, OR is now available! A formal invitation has been sent to your email, and includes a direct link to RSVP for yourself or for your entire party, as well details on the location, arrival time, and attire. Your submissions will remain editable up to the RSVP by date of July 31st.

  For additional information regarding hotel blocks and F.A.Qs, please visit our wedding website at www.allegrasebwedding.com.

  We hope to have you join us for our special day! {rsvpLink}`,

  rsvpReminderJune: `Hello {firstName}, it’s Sebastian & Allegra!

  Our wedding is only 70 days away!

  If you need to update your previous RSVP response, or have yet to RSVP, please be sure to do so no later than July 31st, so that we can provide final numbers in the required timeframe for our vendors.

  For additional information regarding hotel blocks and F.A.Qs, please visit our wedding website at www.allegrasebwedding.com.

  We hope to have you join us for our special day! {rsvpLink}`,

  rsvpReminderJuly: `Hello {firstName}, it’s Sebastian & Allegra!

  The deadline to RSVP to our wedding is 2 weeks away!

  If you need to update your previous RSVP response, or have yet to RSVP, please be sure to do so no later than July 31st, so that we can provide final numbers in the required timeframe for our vendors.

  For additional information regarding hotel blocks and local activities, please visit our wedding website at www.allegrasebwedding.com.

  We hope to have you join us for our special day! {rsvpLink}`,

  hotelBlockReminder: `Hello {firstName}, it’s Sebastian & Allegra!

  Just a quick reminder that the deadline to book one of our hotel block rates is August 8, 2024.

  Please visit our wedding website www.allegrasebwedding.com/hotel-blocks to take advantage of the discounted rates and book with one of our recommended hotels.

  Looking forward to seeing you soon!`,
};

const constructMessage = ({ templateType, firstName = 'Guest', messageToSend = '', memberId, groupId, env = 'dev' }) => {
  let message = templates[templateType] || messageToSend;

  const rsvpLink = env === 'prod'
    ? `https://allegrasebwedding.com/rsvp?userId=${memberId}${groupId ? `&groupId=${groupId}` : ''}`
    : `https://wedding-site-dev.ngrok.io/rsvp?userId=${memberId}${groupId ? `&groupId=${groupId}` : ''}`;

  message = message.replace('{firstName}', firstName).replace('{rsvpLink}', rsvpLink);
  return message;
};

const textMessageLogic = async (event) => {
  try {
    const memberId = event.pathParameters.memberId;
    const messageType = event.queryStringParameters.messageType;

    if (!memberId) return ResponseHandler.badRequest('memberId is required in the path parameters');

    // Fetch member details using the memberId
    const members = await memberService.getMemberByMemberId(memberId);
    if (!members || members.length === 0) return ResponseHandler.notFound('Member not found');

    const member = members[0];
    const { phoneNumber, firstName, groupId } = member;

    if (!phoneNumber) return ResponseHandler.badRequest('Phone number is required for sending text message');

    const builtMessage = constructMessage({
      templateType: messageType,
      firstName: firstName,
      messageToSend: '',
      memberId: memberId,
      groupId: groupId,
      env: event.queryStringParameters.env
    });

    // Send the message using Twilio
    const twilioResp = await client.messages.create({
      from: process.env.TWILLIO_ACCOUNT_NUMBER,
      to: phoneNumber,
      body: builtMessage,
    });

    return ResponseHandler.created(`Sent text - ${twilioResp.sid}`);

  } catch (error) {
    console.log('Error sending text message:', error);
    return ResponseHandler.internalServerError('Internal Server Error');
  }
};

const handler = middy(textMessageLogic)
    .use(cors({
      origin: '*',
      credentials: true,
      headers: '*'
    }));

module.exports.call = handler;

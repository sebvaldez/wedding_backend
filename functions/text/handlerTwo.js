'use strict';

const client = require('twilio')(process.env.TWILLIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN);

module.exports.textMessage = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);

    if (!requestBody.phoneNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'phoneNumber is required in the request body' }),
      };
    }

    const twillioResp = await client.messages.create({
      from: process.env.TWILLIO_ACCOUNT_NUMBER,
      to: requestBody.phoneNumber,
      body: 'Hello from textMessage Lambda',
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

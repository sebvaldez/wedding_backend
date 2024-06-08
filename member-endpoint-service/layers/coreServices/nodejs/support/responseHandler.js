'use strict';

class ResponseHandler {
  static ok(message) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: message }),
    };
  }

  static created(message) {
    return {
      statusCode: 201,
      body: JSON.stringify({ message: message }),
    };
  }

  static badRequest(message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: message }),
    };
  }

  static notFound(message) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: message }),
    };
  }

  static internalServerError(message) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: message }),
    };
  }
}

module.exports = ResponseHandler;

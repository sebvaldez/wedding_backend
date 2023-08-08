export async function handler(event, context) {
  return {
    statusCode: 200,
    headers: {
      /* Required for CORS support to work */
      'Access-Control-Allow-Origin': '*',
      /* Required for cookies, authorization headers with HTTPS */
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify({
      message: 'Hi from Public API',
    }),
  };
}
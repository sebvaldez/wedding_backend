import util from 'util';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const verifyAsync = util.promisify(jwt.verify); // Convert callback-based function to a promise-based one.

// JWKS client for retrieving RSA signing keys
const client = jwksClient({
  jwksUri: `${process.env.AUTH0_TENANT}.well-known/jwks.json`
});

// Retrieve the signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Policy generation function remains the same
const generatePolicy = (principalId, methodArn) => {
  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*';

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: apiGatewayWildcard,
        },
      ],
    },
  };
};

export async function handler(event, context) {

  if (!event.authorizationToken) {
    throw 'Unauthorized';
  }

  const token = event.authorizationToken.replace('Bearer ', '');

  try {
    // You'll verify against the expected audience and issuer
    const claims = await verifyAsync(token, getKey, {
      audience: [process.env.BACKEND_AUDIENCE_ENV, process.env.FRONTEND_AUDIENCE_ENV],
      issuer: process.env.AUTH0_TENANT,
      algorithms: ['RS256']
    });

    const policy = generatePolicy(claims.sub, event.methodArn);

    return {
      ...policy,
      context: claims
    };
  } catch (error) {
    console.log(error);
    throw 'Unauthorized';
  }
};

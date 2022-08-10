const crypto = require('crypto');

exports.handler = async (event) => {
    console.log('> handler', JSON.stringify(event, null, 4));

    const clientCertPem = event.requestContext.identity.clientCert.clientCertPem;
    const clientCert = new crypto.X509Certificate(clientCertPem);
    const clientCertSub = clientCert.subject.replaceAll('\n', ',');

    const response = {
        principalId: clientCertSub,
        context: {
            clientCertSub
        },
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: 'allow',
                Resource: event.methodArn
            }]
        }
    };

    console.log('Authorizer Response', JSON.stringify(response, null, 4));
    return response;
};

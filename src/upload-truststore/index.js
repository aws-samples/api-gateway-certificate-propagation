const https = require('https');
const url = require('url');
const fs = require('fs');
const aws = require('aws-sdk');
const s3 = new aws.S3();

exports.handler = async (event, context) => {
    console.log('handler::', { event });
    switch (event.RequestType) {
        case 'Create':
        case 'Update':
            await pubObject(event, context);
            break;
        case 'Delete':
            await deleteObject(event, context);
            break;
        default:
            throw "Unrecognized request type";
    }

    await sendResponse(event, context);
}

async function pubObject(event) {
    const truststore = fs.readFileSync('./truststore.pem', 'utf8');

    const params = {
        Body: truststore,
        Bucket: event.ResourceProperties.BucketName,
        Key: event.ResourceProperties.ObjectKey
    };

    console.log('pubObject::', { params });

    const response = await s3.putObject(params).promise();

    console.log('pubObject::done', { response });
}

async function deleteObject(event) {
    const params = {
        Bucket: event.ResourceProperties.BucketName,
        Key: event.ResourceProperties.ObjectKey
    };

    console.log('deleteObject::', { params });

    const response = await s3.deleteObject(params).promise();

    console.log('deleteObject::done', { response });
}

async function sendResponse(event, context) {
    console.log('sendResponse::');
    var responseBody = JSON.stringify({
        Status: 'SUCCESS',
        Reason: 'See the details in CloudWatch Logs',
        PhysicalResourceId: event.PhysicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId
    });

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length
        }
    };

    console.log('sendResponse::sending response with options', { options, responseBody });

    return new Promise((resolve, reject) => {
        var request = https.request(options, (response) => {
            console.log('sendResponse::status', response.statusCode);
            console.log('sendResponse::headers', JSON.stringify(response.headers));
            resolve();
        });

        request.on("error", function (error) {
            console.error('sendResponse::failed to send response', error);
            reject();
        });

        request.write(responseBody);
        request.end();
    });
}


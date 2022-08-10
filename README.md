# api-gateway-certificate-propagation

This project contains source code and supporting files for a demo application showcasing usage of Amazon API Gateway and AWS Lambda to implement mTLS, extraction of certificate properties, and propagation of those properties to downstream applications. 

## Architecture
![](arch-diagram.png)

1. The client certificate is stored in a trust store in an Amazon S3 bucket.
2. The client makes a request to the API Gateway endpoint, supplying the
client certificate to establish the mTLS session.
3. API Gateway retrieves the trust store from the S3 bucket, validates the
client certificate, matches the trusted authorities, and terminates the
mTLS connection.
4. API Gateway invokes the Lambda authorizer, providing the request
context and the client certificate information.
5. The Lambda authorizer extracts the client certificate subject, performs
any necessary custom validation, and returns extracted subject to API
Gateway as a part of the authorization context.
6. API Gateway injects the subject extracted in previous step into the
integration request HTTP header and sends the request to downstream
endpoint.
7. The backend application receives the request, extracts the injected
subject, and uses it with custom business logic.


## Prerequisites
* An AWS account. To sign up follow instructions at [Sign Up For AWS](https://aws.amazon.com/resources/create-account/).
* Existing public hosted zone in Amazon Route53, required for setting up custom domain
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

## How to run
1.	Clone the repository. Change directory to `api-gateway-certificate-propagation`

    ```bash
    git clone https://github.com/aws-samples/api-gateway-certificate-propagation.git
    cd api-gateway-certificate-propagation
    ```

2.	Run `generate-certificates.sh` to generate a private root CA and client certificate. Follow the onscreen instructions - make sure you add proper Common Name for both root CA and client certificate, see example below. You can leave other fields blank.

    ![](cert-gen.png)

1. Once certificates are generated, confirm that `truststore.pem` file can be found under `./src/upload-truststore/truststore.pem`

3.	Build the serverless application

    ```bash
    sam build
    ``` 

4.	Deploy the serverless application with --guided option. 

    ```bash
    sam deploy --guided
    ```
 
    > Note: Enabling mTLS on API Gateway requires using custom domains. Before deployment starts you will be asked to provide values for `CustomDomain` and `HostedZoneId` parameters. `CustomDomain` can be any custom subdomain of the root domain you have registered in Route53, e.g., `apigw-cert-propagation-demo.example.com`. `HostedZoneId` must point to the public hosted zone. 

5. Multiple resources are provisioned for you as part of the deployment, it will take several minutes to complete. Following successful deployment, refer to the RestApiEndpoint variable in the Output section to locate the API Gateway endpoint. Make a note of it. You will need it for testing.
 
6.	You can explore the project content while deployment runs

    * `template.yaml` contains the SAM/CloudFormation template for project resources. Each step in the template has comments explaining what is being done. 
    * `generate-certificates.sh` holds openssl commands used to generate private certificate CA, and client certificate. 
    * `/src/upload-truststore` is a simple Lambda function used as custom resource to automatically upload the generated truststore.pem with client certificate to S3 during sam deploy. The trustore file in S3 is a requirement to enable mTLS on API Gateway Custom Domain. 
    * `/src/authorizer` is the Lambda authorizer function used by API Gateway. It extracts the certificate information, and returns required properties back to API Gateway for further propagation to downstream applications. 

## How to test

In the previous section you’ve created a client key and a certificate. They are stored under the `/certificates` directory. Use curl to make a request to the Rest API Endpoint using these files.
 
```bash
curl \
  --cert certificates/client.pem \
  --key certificates/client.key \
  https://<*your-custom-domain*>/sayhello

```
Note: Replace _your-custom-domain_ with the custom domain you created.

The HTTP response contains a simple message and a copy of the request headers sent from API Gateway to the backend. One of those headers is x-client-cert-sub, and the value is the Common Name that you provided to the client certificate during creation. Verify that the value matches the common name you provided when generating the client certificate.

```json
{
  "message": "Hello from sayhello backend app!",
  "requestHeaders": {
    "x-client-cert-sub": "CN=client1",
    // Other headers  
  }
}
```      

API Gateway validated the mTLS client certificate, used the Lambda authorizer to extract the subject common name from the certificate, and forwarded it to the downstream application                 

## Cleaning Up

Use `sam delete` command in the `api-gateway-certificate-propagation` directory to delete resources associated with this sample. 


## Additional resources

* For an introduction to the AWS SAM specification, the AWS SAM CLI, and serverless application concepts, see the [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html).

* For more serverless learning resources, visit [Serverless Land](https://serverlessland.com/)
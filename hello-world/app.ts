import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // console.log('Received event:', JSON.stringify(event.body, null, 2));
        // const requestBody = JSON.parse(event.body || '{}');
        const requestBody = event.body ? JSON.parse(event.body) : {};

        const key = `requests/${Date.now()}-${event.requestContext.requestId}.json`;

        console.log('Received body[key]==', key);

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.REQUEST_BUCKET,
                Key: key,
                Body: JSON.stringify(requestBody, null, 2),
                ContentType: 'application/json',
            }),
        );
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: `Hello, ${requestBody.name}!`,
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};

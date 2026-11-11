import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type,X-Client-Id,X-Request-Id,X-Client-Sent-At,X-Client-Language,X-Client-Timezone',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

const getHeader = (headers: APIGatewayProxyEvent['headers'], name: string) =>
    Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];

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
        const metadata = {
            clientId: getHeader(event.headers, 'X-Client-Id'),
            requestId: getHeader(event.headers, 'X-Request-Id'),
            sentAt: getHeader(event.headers, 'X-Client-Sent-At'),
            receivedAt: new Date().toISOString(),
            serverRequestId: event.requestContext.requestId,
            client: {
                userAgent: getHeader(event.headers, 'User-Agent'),
                language: getHeader(event.headers, 'X-Client-Language') ?? getHeader(event.headers, 'Accept-Language'),
                timezone: getHeader(event.headers, 'X-Client-Timezone'),
            },
        };

        console.log('Received body[key]==', key);

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.REQUEST_BUCKET,
                Key: key,
                Body: JSON.stringify({ request: requestBody, metadata }, null, 2),
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

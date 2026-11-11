import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const requestType = 'greeting';
const typeIndexName = 'RequestsByTypeClientId';
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type,X-Client-Id,X-Request-Id,X-Client-Sent-At,X-Client-Language,X-Client-Timezone',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Content-Type': 'application/json',
};

const getHeader = (headers: APIGatewayProxyEvent['headers'], name: string) =>
    Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];

const response = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
});

function decodeNextToken(token: string | undefined): Record<string, string> | undefined {
    if (!token) return undefined;

    const parsed: unknown = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (
        typeof parsed !== 'object' || parsed === null ||
        typeof (parsed as Record<string, unknown>).clientId !== 'string' ||
        typeof (parsed as Record<string, unknown>).requestId !== 'string' ||
        typeof (parsed as Record<string, unknown>).type !== 'string'
    ) {
        throw new Error('Invalid pagination token');
    }

    return parsed as Record<string, string>;
}

async function saveGreeting(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    let parsedBody: unknown;
    try {
        parsedBody = event.body ? JSON.parse(event.body) : {};
    } catch {
        return response(400, { message: 'Request body must be valid JSON.' });
    }

    if (typeof parsedBody !== 'object' || parsedBody === null || Array.isArray(parsedBody)) {
        return response(400, { message: 'Request body must be a JSON object.' });
    }
    const requestBody = parsedBody as { name?: unknown };

    if (typeof requestBody.name !== 'string' || !requestBody.name.trim()) {
        return response(400, { message: 'name is required.' });
    }

    const clientId = getHeader(event.headers, 'X-Client-Id')?.trim();
    if (!clientId || clientId.length > 200) {
        return response(400, { message: 'X-Client-Id header is required and must be 200 characters or fewer.' });
    }

    const receivedAt = new Date().toISOString();
    const requestId = getHeader(event.headers, 'X-Request-Id')?.trim() || event.requestContext.requestId;
    const sentAt = getHeader(event.headers, 'X-Client-Sent-At') || receivedAt;
    const timezone = getHeader(event.headers, 'X-Client-Timezone') || 'unknown';
    const userAgent = getHeader(event.headers, 'User-Agent') || 'unknown';
    const language = getHeader(event.headers, 'X-Client-Language') || getHeader(event.headers, 'Accept-Language') || 'unknown';
    const s3Key = `requests/${Date.now()}-${event.requestContext.requestId}.json`;
    console.log('From client: ', clientId);
    const metadata = {
        clientId,
        requestId,
        timezone,
        type: requestType,
        sentAt,
        receivedAt,
        userAgent,
        language,
        serverRequestId: event.requestContext.requestId,
    };

    try {
        await s3.send(new PutObjectCommand({
            Bucket: process.env.REQUEST_BUCKET,
            Key: s3Key,
            Body: JSON.stringify({ request: requestBody, metadata }, null, 2),
            ContentType: 'application/json',
        }));

        await dynamo.send(new PutCommand({
            TableName: process.env.REQUESTS_TABLE,
            Item: {
                clientId,
                requestId,
                timezone,
                type: requestType,
                sentAt,
                userAgent,
                language,
                s3Key,
                requestBody,
                receivedAt,
                serverRequestId: event.requestContext.requestId,
            },
        }));
    } catch (error) {
        console.error('Failed to persist greeting request', {
            s3Key,
            serverRequestId: event.requestContext.requestId,
            error,
        });
        return response(500, { message: 'The request could not be fully saved.' });
    }

    return response(200, { message: `Hello, ${requestBody.name.trim()}!` });
}

async function getRequests(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const type = event.queryStringParameters?.type?.trim();
    if (!type) return response(400, { message: 'type query parameter is required.' });

    const rawLimit = event.queryStringParameters?.limit;
    const parsedLimit = rawLimit ? Number(rawLimit) : 50;
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return response(400, { message: 'limit must be a positive integer.' });
    }

    let exclusiveStartKey: Record<string, string> | undefined;
    try {
        exclusiveStartKey = decodeNextToken(event.queryStringParameters?.nextToken);
    } catch {
        return response(400, { message: 'nextToken is invalid.' });
    }

    try {
        const result = await dynamo.send(new QueryCommand({
            TableName: process.env.REQUESTS_TABLE,
            IndexName: typeIndexName,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': type },
            Limit: Math.min(parsedLimit, 100),
            ExclusiveStartKey: exclusiveStartKey,
        }));

        return response(200, {
            type,
            items: result.Items ?? [],
            nextToken: result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
                : null,
        });
    } catch (error) {
        console.error('Failed to query requests by type', { type, error });
        return response(500, { message: 'Requests could not be retrieved.' });
    }
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'GET') return getRequests(event);
    if (event.httpMethod === 'POST') return saveGreeting(event);
    return response(405, { message: 'Method not allowed.' });
};

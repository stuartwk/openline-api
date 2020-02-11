const AWS = require("aws-sdk"); // must be npm installed to use
import { SNSHandler, SNSEvent } from 'aws-lambda';
import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';
import { SNSHelper } from  '../../lib/helpers/sns.helper';
import { ConnectionClient } from '../../lib/clients/connection.client';
import { BroadcastType } from '../../lib/constants/broadcast-type.enum';

export const broadcast: SNSHandler = async (event, _context) => {

    const snsHelper = new SNSHelper();
    const broadcastType = snsHelper.getSNSAttribute(event, 'broadcastType');

    switch (broadcastType) {
        case BroadcastType.BROADCAST_ALL:
            await _broadcastToAll(event);
            break;

        case BroadcastType.BROADCAST_SINGLE:
            await _broadcastToSingle(event);
            break;
    
        default:
            console.error('broadcast type does not match! ', broadcastType);
            break;
    }

}


const _broadcastToSingle = async (event) => {

    console.log('event records sns is: ', event.Records[0].Sns);


    const snsHelper = new SNSHelper();
    const connectionId = snsHelper.getSNSAttribute(event, 'connectionId');
    const payload = JSON.parse(snsHelper.getSNSAttribute(event, 'payload'));
    // const action = snsHelper.getSNSAttribute(event, 'action');

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: 'z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev', // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
    });

    await apigatewaymanagementapi.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
    }).promise();

    return;

}

const _broadcastToAll = async (event) => {

    console.log('BROADCAST TO ALL!');

    const connectionClient = new ConnectionClient();    
    const connectionsRes = await connectionClient.fetchConnections();
    const connections = connectionsRes.Items;
    const snsHelper = new SNSHelper();
    const payload = JSON.parse(snsHelper.getSNSAttribute(event, 'payload'));
    console.log('payload is: ', payload);

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: 'z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev', // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
    });

    for (let i = 0; i < connections.length; i++) {

        const connectionId = connections[i].connectionId;

        await apigatewaymanagementapi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload),
        }).promise();

    }

    return;

}
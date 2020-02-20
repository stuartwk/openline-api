const AWS = require("aws-sdk"); // must be npm installed to use
import { SNSHandler, SNSEvent } from 'aws-lambda';
import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';
import { SNSHelper } from  '../../lib/helpers/sns.helper';
import { ConnectionClient } from '../../lib/clients/connection.client';
import { BroadcastType } from '../../lib/constants/broadcast-type.enum';

export const broadcast: SNSHandler = async (event, _context) => {

    const snsHelper = new SNSHelper();
    const broadcastType = snsHelper.getSNSAttribute(event, 'broadcastType');
    const stage = process.env.STAGE;
    const broadcastUrl = (stage === 'dev')
        ? 'z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev'
        : '5m4ws104ok.execute-api.us-east-1.amazonaws.com/prod';


    if (stage && (stage === 'prod' || stage === 'dev')) {
        switch (broadcastType) {
            case BroadcastType.BROADCAST_ALL:
                await _broadcastToAll(event, broadcastUrl);
                break;
    
            case BroadcastType.BROADCAST_SINGLE:
                await _broadcastToSingle(event, broadcastUrl);
                break;
        
            default:
                console.error('broadcast type does not match! ', broadcastType);
                break;
        }
    } else {
        throw new Error('No stage set in Connections broadcast dispatcher');
    }

}


const _broadcastToSingle = async (event, broadcastUrl: string) => {

    console.log('event records sns is: ', event.Records[0].Sns);


    const snsHelper = new SNSHelper();
    const connectionId = snsHelper.getSNSAttribute(event, 'connectionId');
    const payload = JSON.parse(snsHelper.getSNSAttribute(event, 'payload'));
    // const action = snsHelper.getSNSAttribute(event, 'action');

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: broadcastUrl, // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
    });

    await apigatewaymanagementapi.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
    }).promise();

    return;

}

const _broadcastToAll = async (event, broadcastUrl: string) => {

    console.log('BROADCAST TO ALL!');

    const connectionClient = new ConnectionClient();    
    const connectionsRes = await connectionClient.fetchConnections();
    const connections = connectionsRes.Items;
    const snsHelper = new SNSHelper();
    const payload = JSON.parse(snsHelper.getSNSAttribute(event, 'payload'));

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: broadcastUrl, // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
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
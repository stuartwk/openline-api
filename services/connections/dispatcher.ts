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
    const payload = snsHelper.getSNSAttribute(event, 'payload');
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

    // let connectionsRes;

    // console.log('connection clien created');
    // try {
    //     connectionsRes = await connectionClient.fetchConnections();
    //     console.log('connectionsRes is: ', connectionsRes);
    // } catch(error) {
    //     console.error('error fetching connections! ', error);
    // }

    // const connections = connectionsRes.Items;




    // let connectionsRes;

    // console.log('connection clien created');
    
    const connectionsRes = await connectionClient.fetchConnections();


    const connections = connectionsRes.Items;



    // ========

    // const docClient = new DynamoDB.DocumentClient();

    // const connectionsTable = process.env.CONNECTIONS_TABLE;
    // console.log('connections table is: ', connectionsTable);


    // const params = {
    //     TableName: connectionsTable
    // };

    // console.log('params are: ', params);

    // const connectionRes = await docClient.scan(params).promise();

    // console.log('connection res is: ', connectionRes);

    // const connections = connectionRes.Items;


    // ========




    console.log('fetched connections are: ', connections);

    console.log('event is: ', event.Records[0].Sns);

    const snsHelper = new SNSHelper();
    const payload = JSON.parse(snsHelper.getSNSAttribute(event, 'payload'));
    console.log('payload is: ', payload);

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: 'z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev', // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
    });

    for (let i = 0; i < connections.length; i++) {

        const connectionId = connections[i].connectionId;
        console.log('CONNECTION ID TO BROADCAST ALL IS: ', connectionId);

        await apigatewaymanagementapi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload),
        }).promise();

    }

    return;


    // dynamoDb.scan(params, (err, data) => {

    //     if (err) {
    //       console.error('an error occurred listing: ', err);
    //     } else {
    
    //       data.Items.forEach( async (connection) => {
    
    //         await sendMessageToClient('http://api-dev.openline.telspark.com', connection.connectionId, {
    //           message: 'phones status updated',
    //           type: 'PHONES_UPDATED',
    //           input: phones});
    
    //         return;
    
    //       });
    
    //     }
    
    //     return;
    //   });



}
import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';
import { ConnectionTransmitEvent } from '../../lib/interfaces/connection-transmit-event';

export class ConnectionClient {

    docClient: DynamoDB.DocumentClient;
    connectionsTable: string;

    constructor() {
        this.docClient = new DynamoDB.DocumentClient();
        this.connectionsTable = process.env.CONNECTIONS_TABLE;
    }

    async onConnect(params: {connectionId: string}) {

        const insertParams = {
            TableName: this.connectionsTable,
            Item:{
                "connectionId": params.connectionId,
            }
        };

        return await this.docClient.put(insertParams).promise();

    }

    async onDisconnect(params: {connectionId: string}) {

        const { connectionId } = params;

        const deleteParams = {
            TableName: this.connectionsTable,
            Key:{
                "connectionId": connectionId
            },
          };
          
          return await this.docClient.delete(deleteParams).promise();
    }

    async fetchConnections() {

        console.log('THIS CONNECTIONS TABLE IS: ', this.connectionsTable);
        console.log('this doc client is: ', this.docClient);

        const params = {
            TableName: this.connectionsTable
        };
     
        // const res = await this.docClient.scan(params).promise();

        try {
            console.log('fetch conncetions');
            // return await this.docClient.scan(params).promise();

            // this.docClient.scan(params, (err, data) => {

            //     if (err) {
            //       console.error('an error occurred listing: ', err);
            //     } else {

            //         console.log('no error, data is: ', data);
            
            //       data.Items.forEach( async (connection) => {

            //         console.log('connection is: ', connection);
            
            //         // await sendMessageToClient('http://api-dev.openline.telspark.com', connection.connectionId, {
            //         //   message: 'phones status updated',
            //         //   type: 'PHONES_UPDATED',
            //         //   input: phones});
            
            //         // return;
            
            //       });
            
            //     }
            
            //     // return;
            //   });

            return await this.docClient.scan(params).promise();


        } catch (error) {
            console.error('something went wrong');
            console.error(error);
            throw(error);
        }

        // console.log('connections res is: ', res);

        // return res.Items;
        
        // this.docClient.scan(params, (err, data) => {

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
        // });

    }

    async transmit(params: {connectionID: string, payload: ConnectionTransmitEvent<any>}) {

        const { connectionID, payload } = params;

        console.log('transmitting to: ', connectionID);
        console.log('transmitting data: ', payload);

        const apigatewaymanagementapi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: 'z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev', // wss://z2eidukkpb.execute-api.us-east-1.amazonaws.com/dev
          });
        
        
          return await apigatewaymanagementapi.postToConnection({
            ConnectionId: connectionID,
            Data: JSON.stringify(payload),
          }).promise();

        // const { connectionId, data } = params;

    }

}

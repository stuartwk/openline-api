import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';

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

    async transmit(params: {connectionID: string, payload}) {

        const { connectionID, payload } = params;

        const apigatewaymanagementapi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: 'co3xyaosg9.execute-api.us-east-1.amazonaws.com/dev', // wss://co3xyaosg9.execute-api.us-east-1.amazonaws.com/dev
          });
        
        
          return await apigatewaymanagementapi.postToConnection({
            ConnectionId: connectionID,
            Data: JSON.stringify(payload),
          }).promise();

        // const { connectionId, data } = params;

    }

}

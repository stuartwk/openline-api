import { DynamoDB } from 'aws-sdk';

export class OrdersClient {

    docClient: DynamoDB.DocumentClient;
    ordersTable: string;

    constructor() {
        this.docClient = new DynamoDB.DocumentClient();
        this.ordersTable = process.env.ORDERS_TABLE;
    }

    async create(order: {id: string, phoneNumber: string, expiresAt: number, ip: string, chargeId: string, connectionId: string}) {
        
        const query = {
            TableName : this.ordersTable,
            Item: order,
        };
    
        try {
            return await this.docClient.put(query).promise();
        } catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async fetchOne(o: {id: string}) {

        const { id } = o;

        let dbParams = {
            TableName: this.ordersTable,
            Key:{
              "id": id,
            }
        };
        
        try {
            return await this.docClient.get(dbParams).promise();
        }
        catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

}
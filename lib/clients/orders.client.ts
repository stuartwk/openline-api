import { DynamoDB } from 'aws-sdk';
import { OrderStatus } from '../constants/order-status.enum';
import { PhoneRegion } from '../constants/phone-region.enum';

export class OrdersClient {

    docClient: DynamoDB.DocumentClient;
    ordersTable: string;

    constructor() {
        this.docClient = new DynamoDB.DocumentClient();
        this.ordersTable = process.env.ORDERS_TABLE;
    }

    async create(order: {
        id: string, 
        phoneNumber: string, 
        expiresAt: number, 
        ip: string, 
        chargeId: string, 
        connectionId: string,
        status: OrderStatus,
        region: PhoneRegion,
        extendingOrder: boolean;
    }) {
        
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

    async markOrderPaid(p: {id: string, connection?: {id: string, phoneNumber: string, userName: string, password: string, reservedUntil: number}}) {

        // const { id, connection } = p;
        const id = p.id;

        const updateExpression = (p.connection)
            ? "SET #status = :status, #connection = :connection"
            : "SET #status = :status";
        
        const attributeNames = (p.connection) 
            ? {"#status" : "status", "#connection" : "callConnectionAuth"}
            : {"#status" : "status"};

        const attributeValues = (p.connection) 
            ? {":status": 'PAID', ":connection": p.connection}
            : {":status": 'PAID'}

        const params = {
            TableName: this.ordersTable,
            Key:{
                "id": id,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames : attributeNames,
            ExpressionAttributeValues: attributeValues,
            ReturnValues:"ALL_NEW"
        };
        
        console.log("marking order paid...");
        return await this.docClient.update(params).promise();

    }

    async markOrderRefunded(orderId: string) {

        const updateExpression = "SET #refunded = :refunded";
        
        const attributeNames = {"#refunded" : "refunded"};

        const attributeValues = {":refunded": true}

        const params = {
            TableName: this.ordersTable,
            Key:{
                "id": orderId,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames : attributeNames,
            ExpressionAttributeValues: attributeValues,
            ReturnValues:"ALL_NEW"
        };
        
        console.log("marking order paid...");
        return await this.docClient.update(params).promise();

    }

}
import { DynamoDB } from 'aws-sdk';
import { PhoneRegion } from '../constants/phone-region.enum';

export class PhonesClient {

    docClient: DynamoDB.DocumentClient;
    phonesTable: string;

    constructor() {
        this.docClient = new DynamoDB.DocumentClient();
        this.phonesTable = process.env.PHONES_TABLE;
    }

    async fetchPhones(p: {region: PhoneRegion}) {

        try {
            
            const { region } = p;

            const params = {
                TableName : this.phonesTable,
                KeyConditionExpression: "#rgn = :rgn",
                ExpressionAttributeNames:{
                    "#rgn": "region",
                },
                ExpressionAttributeValues: {
                    ":rgn": region
                }
            };
            
            return await this.docClient.query(params).promise();
        
        } catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async reservePhone(p: {region: PhoneRegion, phoneNumber: string}) {

        try {
            const { region, phoneNumber } = p;
            const exipiresAt = new Date();
            exipiresAt.setHours( exipiresAt.getHours() + 1 );
            const exipiresUnix = + exipiresAt;
    
            const params = {
                TableName: this.phonesTable,
                Key:{
                    "region": region,
                    "phoneNumber": phoneNumber
                },
                UpdateExpression: "set reservedUntil = :ru",
                ExpressionAttributeValues:{
                    ":ru": Math.floor(exipiresUnix / 1000),
                },
                ReturnValues:"UPDATED_NEW"
            };
            
            console.log("Reserving phone...");
            return await this.docClient.update(params).promise();
            
        } catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async unreservePhone(p: {region: PhoneRegion, phoneNumber: string}) {

        try {

            const { region, phoneNumber } = p;

            const params = {
                TableName: this.phonesTable,
                Key : {
                    "region": region,
                    "phoneNumber": phoneNumber            
                },
                UpdateExpression : "REMOVE reservedUntil",
                ReturnValues : "UPDATED_NEW"
            };
        
            return await this.docClient.update(params).promise();
            
        } catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }
    }

}
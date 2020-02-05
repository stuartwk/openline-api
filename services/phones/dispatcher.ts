// const AWS = require("aws-sdk"); // must be npm installed to use
import { SNSHandler, SNSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { SNS } from 'aws-sdk';

const _getSNSAttribute = (event: SNSEvent, attribute: string) => {

    if (event && event.Records && event.Records.length > 0) {

        const sns = event.Records[0].Sns;
        const messageAttributes = sns.MessageAttributes;

        if (messageAttributes[attribute]) {
            return messageAttributes[attribute].Value;
        } else {
            throw(Error(`no ${attribute} attribute found in reservePhone SNS`));
        }

        // if (messageAttributes.region) {
        //     region = messageAttributes.phoneNumber.Value;
        // } else {
        //     throw(Error('no phoneNumber attribute found in reservePhone SNS'));
        // }


    }

}

export const reservePhone: SNSHandler = async (event, _context) => {


    console.log('DISPATCHER UPDATE PHONE HIT!');

    console.log('event is: ', event);

    console.log('=======================');
    
    console.log('sns is: ', event.Records[0].Sns);

    const phonesTable = process.env.PHONES_TABLE;
    const docClient = new DynamoDB.DocumentClient();

    const phoneNumber = _getSNSAttribute(event, 'phoneNumber');
    const region = _getSNSAttribute(event, 'region');

    console.log('reservePhone phoneNumber: ', phoneNumber);
    console.log('reservePhone region: ', region);

    // if (event && event.Records && event.Records.length > 0) {

    //     const sns = event.Records[0].Sns;
    //     const messageAttributes = sns.MessageAttributes;

    //     if (messageAttributes.phoneNumber) {
    //         phoneNumber = messageAttributes.phoneNumber.Value;
    //     } else {
    //         throw(Error('no phoneNumber attribute found in reservePhone SNS'));
    //     }

    //     if (messageAttributes.region) {
    //         region = messageAttributes.phoneNumber.Value;
    //     } else {
    //         throw(Error('no phoneNumber attribute found in reservePhone SNS'));
    //     }


    // }

    // RESERVE PHONE

    const exipiresAt = new Date();
    exipiresAt.setHours( exipiresAt.getHours() + 1 );
    const exipiresUnix = + exipiresAt;

    try {
        // const { region, phoneNumber } = p;

        const params = {
            TableName: phonesTable,
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
        const update = await docClient.update(params).promise();
        console.log('update is: ', update);
        
    } catch (error) {
        console.error(`${error.status} | ${error.message}`);
        throw(error);
    }

    console.log('proccess.env.connectionSnsTopicArn is:', process.env.connectionSnsTopicArn);

    const payload = {
        input: {
            phoneNumber,
            region,
            reservedUntil: Math.floor(exipiresUnix / 1000)
        },
        type: 'PHONE_RESERVED'
    };

    // Create publish parameters
    const params = {
        Message: `PHONE_RESERVED`, /* required */
        MessageAttributes: {
            broadcastType: {
                DataType: 'String',
                StringValue: 'BROADCAST_ALL'
            },
            payload: {
                DataType: 'String',
                StringValue: JSON.stringify(payload)
            }
        },
        // Message: body,
        TopicArn: process.env.connectionSnsTopicArn,
        // MessageStructure: 'json'
        // Type: 'RESERVE_PHONE'
      };

      console.log('about to broadcast this... ', params);
  
      // Create promise and SNS service object
      try {
        await new SNS({apiVersion: '2010-03-31', region: "us-east-1"}).publish(params).promise();
  
        // const reservePhoneRes = await reservePhoneSNS;
    
        // console.log('broadcastPhoneReservedSNS is: ', broadcastPhoneReservedSNS);
        return;
      } catch(error) {
          console.log('error@@@@@ broadcasting phone reserved: ', error);
          return;
      }

      return;


}


export const unReservePhone: SNSHandler = async (event, _context) => { 

    const phonesTable = process.env.PHONES_TABLE;
    const docClient = new DynamoDB.DocumentClient();

    const phoneNumber = _getSNSAttribute(event, 'phoneNumber');
    const region = _getSNSAttribute(event, 'region');


    // // UNRESERVE PHONE

    try {

        // const { region, phoneNumber } = p;

        const params = {
            TableName: phonesTable,
            Key : {
                "region": region,
                "phoneNumber": phoneNumber            
            },
            UpdateExpression : "REMOVE reservedUntil",
            ReturnValues : "UPDATED_NEW"
        };
    
        const update = await docClient.update(params).promise();
        console.log('unreserved phone update is: ', update);
        
    } catch (error) {
        console.error(`${error.status} | ${error.message}`);
        throw(error);
    }

}

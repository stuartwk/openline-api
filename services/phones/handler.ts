import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { PhonesClient } from '../../lib/clients/phones.client';
import { PhoneRegion } from '../../lib/constants/phone-region.enum';
import { DynamoDB, SNS } from 'aws-sdk';
import { BroadcastType } from '../../lib/constants/broadcast-type.enum';

export const fetchPhones: APIGatewayProxyHandler = async (event, _context) => {

  const CORS = process.env.CORS;
  const headers = {
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Credentials': true,
  };
  const queryParams = event.queryStringParameters;
  const phonesClient = new PhonesClient();
  const region: PhoneRegion = (queryParams && queryParams.region) ? PhoneRegion[queryParams.region] : PhoneRegion.USA;;

  if (region) {

    try {
      const phonesRes = await phonesClient.fetchPhones({region});
    
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: '☎️s fetched',
          input: phonesRes.Items,
        }, null, 2),
      };      
    } catch (error) {

      console.error(`${error.status} | ${error.message}`);
    
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: 'Something went wrong fetching lines',
        }, null, 2),
      };
    }

  } else {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        message: 'Sorry, that region is not available in Openline',
      }, null, 2),
    };
  }

}

export const telnyxHooks: APIGatewayProxyHandler = async (event, _context) => {

  const headers = {
    'Access-Control-Allow-Origin': '*.telnyx.com',
    'Access-Control-Allow-Credentials': true,
  };
  const docClient = new DynamoDB.DocumentClient();
  const phonesTable = process.env.PHONES_TABLE;
  const body = JSON.parse(event.body);
  console.log('body is: ', body);

  if (body.event_type && body.event_type === 'call_hangup') {

    console.log('type is hangup');

    const payload = body.payload;
    const connectionId = payload.connection_id;

    // if (payload.hangup_cause === 'normal_clearing' || payload.hangup_cause === 'originator_cancel') {


      // ==========================
      // scan phones
      // ==========================
    
      const phones = await docClient.scan({
        TableName: phonesTable,
      }).promise();
  
      const target = phones.Items.find( (phone) => phone.connectionId === connectionId );
  
      if (target) {
  
        const params = {
          TableName: phonesTable,
          Key : {
              "region": target.region,
              "phoneNumber": target.phoneNumber            
          },
          UpdateExpression : "REMOVE reservedUntil",
          ReturnValues : "UPDATED_NEW"
        };
  
        const _ = await docClient.update(params).promise();

        /**
         * BROADCAST TO ALL PHONE IS NOW AVAILABLE
         */

      const payload = {
        type: 'PHONE_UNRESERVED',
        input: target
      }

      // Create Order Paid publish parameters
      const snsParams = {
        Message: `PHONE_UNRESERVED`,
        MessageAttributes: {
            broadcastType: {
                DataType: 'String',
                StringValue: BroadcastType.BROADCAST_ALL
            },
            payload: {
                DataType: 'String',
                StringValue: JSON.stringify(payload)
            },
        },
        TopicArn: process.env.connectionSnsTopicArn,
      };

        // Reserve Phone SNS
        await new SNS({apiVersion: '2010-03-31', region: "us-east-1"}).publish(snsParams).promise();
  
      }

    // }

  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Thanks for the ☎️ hook',
    }, null, 2),
  };

}

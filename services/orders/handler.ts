import { APIGatewayProxyHandler, SNSEvent } from 'aws-lambda';
import 'source-map-support/register';
import { OpenNodeChargeClient } from '../../lib/clients/opennode-charge.client';
import { OrdersClient } from '../../lib/clients/orders.client';
import { OrderStatus } from '../../lib/constants/order-status.enum';
import { PhonesClient } from '../../lib/clients/phones.client';
// import { ConnectionClient } from '../../lib/clients/connection.client';
import { TelnyxConnectionsClient } from '../../lib/clients/telnyx-connections-client';
// import { ConnectionTransmitTypes } from '../../lib/constants/connection-transmit-types.enum';
import { SNS } from 'aws-sdk';
const querystring = require('querystring');
const crypto = require("crypto");
const fetch = require('node-fetch');
import { BroadcastType } from '../../lib/constants/broadcast-type.enum';

export const create: APIGatewayProxyHandler = async (event, _context) => {

  const CORS = process.env.CORS;
  const order_id = crypto.randomBytes(16).toString("hex");
  let exipiresAt = new Date();
  exipiresAt.setHours( exipiresAt.getHours() + 1 );
  const reqParams = JSON.parse(event.body);
  const { phoneNumber, connectionId, region } = reqParams;
  const expiresUnix = Math.floor( (+ exipiresAt) / 1000);
  const { stage } = event.requestContext;
  const openNodeChargeClient = new OpenNodeChargeClient(stage);
  const ordersClient = new OrdersClient();
  const charge = await openNodeChargeClient.createCharge(order_id);
  const headers = {
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Credentials': true,
  };

  try {
    
    await ordersClient.create({
      id: order_id,
      phoneNumber, 
      connectionId, 
      ip: event.requestContext.identity.sourceIp, 
      expiresAt: expiresUnix, 
      chargeId: charge.id,
      status: OrderStatus.UNPAID,
      region
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
        input: {order_id},
      }, null, 2),
    };

  } catch (error) {
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'There was an error creating your order',
        error,
      }, null, 2),
    };

  }

}

export const fetchCharge: APIGatewayProxyHandler = async (event, _context) => {

  const CORS = process.env.CORS;
  const { stage } = event.requestContext;
  const pathParams = event.pathParameters;
  const { orderId } = pathParams;
  const headers = {
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Credentials': true,
  };
  const ordersClient = new OrdersClient();
  const openNodeChargeClient = new OpenNodeChargeClient(stage);
  let order;
  let charge;

  try {
    const orderRes = await ordersClient.fetchOne({id: orderId});
    order = orderRes.Item;
  } catch (error) {
    console.error(`${error.status} | ${error.message}`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'There was an error fetching your order',
        error,
      }, null, 2),
    };
  }

  try {
    charge = await openNodeChargeClient.fetchCharge(order.chargeId);
  } catch (error) {
    console.error(`${error.status} | ${error.message}`);
  }

  order.charge = charge;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Order successfully fetched',
      input: order,
    }, null, 2),
  };

}

export const openNodeChargeWebhook = async (event, _context) => {

  const headers = {
    'Access-Control-Allow-Origin': '*.opennode.com',
    'Access-Control-Allow-Credentials': true,
  };

  const reqBody = querystring.parse(event.body);
  const { order_id, status } = reqBody;
  const phonesClient = new PhonesClient();
  const ordersClient = new OrdersClient();
  const telnyxConnectionClient = new TelnyxConnectionsClient();
  const exipiresAt = new Date();
  exipiresAt.setHours( exipiresAt.getHours() + 1 );
  const exipiresUnix = + exipiresAt;
  const reservedUntil = Math.floor(exipiresUnix / 1000);

  if (status === 'paid') {

    const orderRes = await ordersClient.fetchOne({id: order_id});
    const order = orderRes.Item;
    const phonesRes = await phonesClient.fetchPhones({region: order.region});
    const phones = phonesRes.Items;
    const availablePhone = phones.find( (phone) => !phone.reservedUntil );

    // SNS Params to Reserve Phone
    var params = {
      Message: `RESERVE_${order.region}_${availablePhone.phoneNumber}`, /* required */
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: 'RESERVE_PHONE'
        },
        phoneNumber: {
          DataType: 'String',
          StringValue: availablePhone.phoneNumber
        },
        region: {
          DataType: 'String',
          StringValue: order.region
        }
      },
      TopicArn: process.env.phoneSnsTopicArn,
    };

    // Reserve Phone SNS
    await new SNS({apiVersion: '2010-03-31', region: "us-east-1"}).publish(params).promise();

    const connectionAuth = await telnyxConnectionClient.resetConnectionAuth(availablePhone.connectionId);

    const connection = {
      id: availablePhone.connectionId,
      phoneNumber: availablePhone.phoneNumber,
      userName: connectionAuth.user_name,
      password: connectionAuth.password,
      reservedUntil
    };

    const paidRes = await ordersClient.markOrderPaid({id: order_id, connection});

    if (paidRes.Attributes) {

      const paidOrder = paidRes.Attributes;

      const payload = {
        type: 'ORDER_PAID',
        input: paidOrder
      };

      // Create Order Paid publish parameters
      const orderPaidParams = {
        Message: `ORDER_PAID`,
        MessageAttributes: {
            broadcastType: {
                DataType: 'String',
                StringValue: BroadcastType.BROADCAST_SINGLE
            },
            payload: {
                DataType: 'String',
                StringValue: JSON.stringify(payload)
            },
            connectionId: {
              DataType: 'String',
              StringValue: paidOrder.connectionId
            }
        },
        TopicArn: process.env.connectionSnsTopicArn,
      };

      // Create promise and SNS service object
      try {
        await new SNS({apiVersion: '2010-03-31', region: "us-east-1"}).publish(orderPaidParams).promise();
      } catch(error) {
          console.log('error@@@@@ broadcasting phone reserved: ', error);
      }

    }

  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Order successfully fetched',
      input: {},
    }, null, 2),
  };

}

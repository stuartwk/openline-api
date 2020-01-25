import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { OpenNodeChargeClient } from '../../lib/clients/opennode-charge.client';
import { OrdersClient } from '../../lib/clients/orders.client';
const crypto = require("crypto");

export const create: APIGatewayProxyHandler = async (event, _context) => {

  const CORS = process.env.CORS;
  const order_id = crypto.randomBytes(16).toString("hex");
  let exipiresAt = new Date();
  exipiresAt.setHours( exipiresAt.getHours() + 1 );
  const reqParams = JSON.parse(event.body);
  const { phoneNumber, connectionId } = reqParams;
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
      chargeId: charge.id
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

export const fetch: APIGatewayProxyHandler = async (event, _context) => {

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

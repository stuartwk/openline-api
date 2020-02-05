import { APIGatewayProxyHandler, Handler } from 'aws-lambda';
import 'source-map-support/register';
import { ConnectionClient } from '../../lib/clients/connection.client';
import { ConnectionTransmitTypes } from '../../lib/constants/connection-transmit-types.enum';

export const hello: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
}

const enum RouteKeyTypes {
  CONNECT     = '$connect',
  DISCONNECT  = '$disconnect'  
}

export const connectionHandler: Handler = async (event, _context) => {


  console.log('CONNETION HANDLER HIT!');

  const connectionClient = new ConnectionClient();
  const { requestContext } = event;
  const { routeKey, connectionId } = requestContext;

  switch (routeKey) {
    case RouteKeyTypes.CONNECT:
      const onConnect = await connectionClient.onConnect({connectionId});
      console.log('onConnect is: ', onConnect);
      return {statusCode: 200};

    case RouteKeyTypes.DISCONNECT:
      const onDisconnect =  await connectionClient.onDisconnect({connectionId});
      console.log('on disconnect is: ', onDisconnect);
      return {statusCode: 200};
  
    default:
      console.log('routekey is: ', routeKey);
      break;
  }

}

export const getConnectionId: Handler = async (event, context) => {

  const requestContext = event.requestContext;
  const connectionClient = new ConnectionClient();

  // await sendMessageToClient('http://api-dev.openline.telspark.com', requestContext.connectionId, {
  //   message: 'connection id retreived',
  //   type: 'SET_CONNECTION_ID',
  //   input: requestContext.connectionId});

  const message = await connectionClient.transmit({connectionID: requestContext.connectionId, payload: {
      message: 'connection id retreived',
      type: ConnectionTransmitTypes.SET_CONNECTION_ID,
      input: requestContext.connectionId}});
  
  console.log('message is: ', message);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: 'get connection id successful',
    }),
  };
}

// necessary to deploy with
export const test = (_event, _context) => {

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Got test 😃',
      input: true,
    }, null, 2),
  }

}
import { SNSHandler, SNSEvent } from 'aws-lambda';

export class SNSHelper {

    constructor() { }

    getSNSAttribute(event: SNSEvent, attribute: string) {

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
}
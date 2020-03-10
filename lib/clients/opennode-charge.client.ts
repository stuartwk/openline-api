const opennode = require('opennode');

export class OpenNodeChargeClient {

    callbackUrl: string;
    charge: number;
    stage: 'dev' | 'prod';

    constructor(stage) {

        this.stage = stage;

        // switch (stage) {
        //     case 'dev':
        //         this.charge = 1;
        //         this.callbackUrl = 'https://api-dev.openline.telspark.com/orders/payment';
        //         // c1ab40e1-0305-4318-9c2a-f77cb6b5fd9d
        //         opennode.setCredentials('8001f9cc-9f1c-41bf-a68d-2f8b8eaeea21', 'dev');
        //         break;

        //     case 'prod':
        //         console.log('stage is prod!');
        //         this.charge = 5000;
        //         this.callbackUrl = 'https://api.openline.telspark.com/orders/payment';
        //         opennode.setCredentials('6d2ab276-558d-4c30-815e-eff773eaa84e');
        //         break;
        
        //     default:
        //         console.error('incorrect state set');
        //         break;
        // }

    }

    setupOpennode(type: 'invoice' | 'withdrawl') {

        switch (this.stage) {
            case 'dev':
                this.charge = 1;
                this.callbackUrl = 'https://api-dev.openline.telspark.com/orders/payment';

                opennode.setCredentials( (type === 'invoice') 
                    //  invoice key
                    ? '8001f9cc-9f1c-41bf-a68d-2f8b8eaeea21'
                    // withdrawl key
                    : 'c1ab40e1-0305-4318-9c2a-f77cb6b5fd9d', 'dev');
                break;

            case 'prod':
                console.log('stage is prod!');
                this.charge = 5000;
                this.callbackUrl = 'https://api.openline.telspark.com/orders/payment';
                opennode.setCredentials( (type === 'invoice')
                    // invoice key
                    ? '6d2ab276-558d-4c30-815e-eff773eaa84e'
                    // withdrawl key
                    : '5a1963dc-5e15-4e51-9de1-0b0ee1e50c09');
                break;
        
            default:
                console.error('incorrect state set');
                break;
        }

    }

    async createCharge(order_id: string) {

        this.setupOpennode('invoice');

        try {
            return await opennode.createCharge({
              amount: this.charge,
              // currency: "USD",
              callback_url: this.callbackUrl,
              auto_settle: false,
              order_id
            });
          }
          catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
          }
    }

    async fetchCharge(chargeId: string) {
        this.setupOpennode('invoice');

        try {
            return await opennode.chargeInfo(chargeId);
        }
        catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async createRefund(invoice) {

        this.setupOpennode('withdrawl');

        const callback_url = (this.stage === 'dev') 
            ? 'https://api-dev.openline.telspark.com/orders/refund'
            : 'https://api.openline.telspark.com/orders/refund';

        console.log('OpenNodeChargeClient -> CREATE REFUND: ', invoice);

        try {

            // return await opennode.refundCharge({
            //     checkout_id: p.chargeId,
            //     address: p.address
            // });

            return await opennode.initiateWithdrawalAsync({
                type: 'ln',
                amount: this.charge,
                address: invoice,
                callback_url
            });

        } catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async ensureChargeValidity(charge) {
        this.setupOpennode('invoice');
        return await opennode.signatureIsValid(charge);
    }

}

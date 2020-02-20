const opennode = require('opennode');

export class OpenNodeChargeClient {

    callbackUrl: string;

    constructor(stage) {

        switch (stage) {
            case 'dev':
                console.log('stage is dev!');
                this.callbackUrl = 'https://api-dev.openline.telspark.com/orders/payment';
                opennode.setCredentials('8001f9cc-9f1c-41bf-a68d-2f8b8eaeea21', 'dev');
                break;

            case 'prod':
                console.log('stage is prod!');
                this.callbackUrl = 'https://api.openline.telspark.com/orders/payment';
                opennode.setCredentials('6d2ab276-558d-4c30-815e-eff773eaa84e');
                break;
        
            default:
                console.error('incorrect state set');
                break;
        }

    }

    async createCharge(order_id: string) {

        try {
            return await opennode.createCharge({
              amount: 1,
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

        try {
            return await opennode.chargeInfo(chargeId);
        }
        catch (error) {
            console.error(`${error.status} | ${error.message}`);
            throw(error);
        }

    }

    async ensureChargeValidity(charge) {
        return await opennode.signatureIsValid(charge);
    }

}

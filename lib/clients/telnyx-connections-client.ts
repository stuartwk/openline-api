const fetch = require('node-fetch');

export class TelnyxConnectionsClient {

    constructor() { }

    async resetConnectionAuth(id: string) {


        // const suggestions = await fetch(`https://api.telnyx.com/security/connections/${id}/credential_authentication/suggestion`, {
        //     headers: {'x-api-user': 'stuart@doppiaeast.com', 'x-api-token': 'JyUHNPaiRzmU5tJvuZOabw'}
        //     })
        //     .then(res => res.json())
        //     .then(json => {
        //     console.log('return suggestions json is: ', json)
        //     return json
        //     })
        //     .catch( (err) => console.log('something went wrong: ', err) );

        console.log('resetConnectionAuth id is: ', id);

        const suggestions = await this.getConnectionSuggestions(id);
        console.log('suggestions are: ', suggestions);

        if (suggestions) {

            const { user_name, password } = suggestions;

            const creds = await fetch(`https://api.telnyx.com/security/connections/${id}/credential_authentication`, {
              method: 'PUT',
              body: JSON.stringify({user_name, password}),
              headers: {'x-api-user': 'stuart@doppiaeast.com', 'x-api-token': 'JyUHNPaiRzmU5tJvuZOabw', 'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(json => {
              console.log('returned update json is: ', json);
              return json
            })
            .catch( (err) => console.log('something went wrong: ', err) );

            console.log('creds are: ', creds);

            return creds;

        } else {

        }

        

    }

    async getConnectionSuggestions(id) {

        console.log('get connection suggestions by id: ', id);
        const suggestions = await fetch(`https://api.telnyx.com/security/connections/${id}/credential_authentication/suggestion`, {
            headers: {'x-api-user': 'stuart@doppiaeast.com', 'x-api-token': 'JyUHNPaiRzmU5tJvuZOabw'}
            })
            .then(res => res.json())
            .then(json => {
                console.log('return suggestions json is: ', json)
                return json
            })
            .catch( (err) => console.log('something went wrong: ', err) );

        console.log('getConnectionSuggestions: ', suggestions);

        return suggestions;
    }

}

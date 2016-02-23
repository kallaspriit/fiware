Orion context broker
====================

Setup
-----
- `npm install` to install dependencies

Running the examples
--------------------
- `npm run lab` to run the lab communication example
- `npm run server` to run the evaluation test server

Lab example
-----------
`npm run lab`

### Password configuration file
Do not have to always enter username and password when testing it, create a `credentials.json` file with contents like
```json
{
  "username": "me@example.com",
  "password": "secret"
}
```
This file is also generated automatically on first use.

Server example
--------------
`npm run server`

### Testing
Open browser at [http://localhost:1028/accumulate](http://localhost:1028/accumulate)

### Expected payload format
```
{
    "subscriptionId": "51c0ac9ed714fb3b37d7d5a8",
    "originator": "localhost",
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature",
                        "type": "float",
                        "value": "26.5"
                    }
                ],
                "type": "Room",
                "isPattern": "false",
                "id": "Room1"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```
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

### Test server and view help
Open browser at [http://localhost:1028/](http://localhost:1028/). It should display some help info.


### Mirror request
You can make a subscription to http://localhost:1028/mirror, it will echo back and log the request.

### Subscription payload format
```
{
  "subscriptionId": "56cc2b2d981044052d2e160e",
  "originator": "localhost",
  "contextResponses": [
    {
      "contextElement": {
        "type": "Room",
        "isPattern": "false",
        "id": "lab",
        "attributes": [
          {
            "name": "temperature",
            "type": "float",
            "value": "26.5"
          },
          {
            "name": "pressure",
            "type": "integer",
            "value": "763"
          }
        ]
      },
      "statusCode": {
        "code": "200",
        "reasonPhrase": "OK"
      }
    }
  ]
}
```
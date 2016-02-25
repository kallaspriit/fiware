IoT Platform Evaluation Test
============================
The goal of the test is to create a practical use-case of an IoT device that:
- periodically reports some state to the server
- accepts commands from the server to perform a task
- can be queried by the server for current state

The state of the device can be monitored from the server API interface. The server keeps track of the last 100
measurements and the average of them. An external web application can read this data and graph the results. This
interface also enables sending a command to the device to perform an action.

Specifically the device is an Arduino YUN connected to a wifi network. It reports room temperature and pressure (can be
fake) and accepts a command to toggle it's build-in LED.

Setup
-----

### Configure FIWARE instance
- [Installing orion](https://fiware-orion.readthedocs.org/en/develop/admin/install/index.html)
- [API walkthrough](https://fiware-orion.readthedocs.org/en/develop/user/walkthrough_apiv1/index.html)
- [API v1](http://telefonicaid.github.io/fiware-orion/api/v1/)
- [Accumulator server example](https://github.com/telefonicaid/fiware-orion/blob/master/scripts/accumulator-server.py)
- Amazon AMI `Basic IoT Stack powered by FIWARE v0.2.0 (ami-a97919de)`
- SSH into the instance

### Create room "lab"
```
(curl localhost:1026/v1/updateContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "contextElements": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab",
            "attributes": [
                {
                    "name": "temperature",
                    "type": "float",
                    "value": "22"
                },
                {
                    "name": "pressure",
                    "type": "integer",
                    "value": "720"
                }
            ]
        }
    ],
    "updateAction": "APPEND"
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature",
                        "type": "float",
                        "value": ""
                    },
                    {
                        "name": "pressure",
                        "type": "integer",
                        "value": ""
                    }
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Query created room information
```
(curl localhost:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab"
        }
    ]
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature",
                        "type": "float",
                        "value": "22"
                    },
                    {
                        "name": "pressure",
                        "type": "integer",
                        "value": "720"
                    }
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Query created room information as an object where keys are the attribute names
```
(curl localhost:1026/v1/queryContext?attributeFormat=object -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab"
        }
    ]
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": {
                    "pressure": {
                        "type": "integer",
                        "value": "720"
                    },
                    "temperature": {
                        "type": "float",
                        "value": "22"
                    }
                },
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Query only for temperature
```
(curl localhost:1026/v1/queryContext?attributeFormat=object -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab"
        }
    ],
    "attributes": [
        "temperature"
    ]
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": {
                    "temperature": {
                        "type": "float",
                        "value": "22"
                    }
                },
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Query by regular expression
```
(curl localhost:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "true",
            "id": "la.*"
        }
    ],
    "attributes": [
        "temperature"
    ]
} 
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature",
                        "type": "float",
                        "value": "22"
                    }
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Querying invalid entity gives error
```
(curl localhost:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "true",
            "id": "xxx"
        }
    ],
    "attributes": [
        "temperature"
    ]
}
EOF
```

```
{
    "errorCode": {
        "code": "404",
        "reasonPhrase": "No context element found"
    }
}
```

### Update attributes
```
(curl localhost:1026/v1/updateContext -s -S --header 'Content-Type: application/json' \
     --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "contextElements": [
        {
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
        }
    ],
    "updateAction": "UPDATE"
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature",
                        "type": "float",
                        "value": ""
                    },
                    {
                        "name": "pressure",
                        "type": "integer",
                        "value": ""
                    }
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Get all entities
```
curl localhost:1026/v1/contextEntities -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' | python -mjson.tool
```

```
{
    "contextResponses": [
        ...
        {
            "contextElement": {
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
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Setup subscription server
- `git clone git clone https://github.com/kallaspriit/fiware.git`
- `cd fiware/context-broker`
- `npm install`
- `npm run server`

### Subscribe for temperature and pressure changes
```
(curl localhost:1026/v1/subscribeContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab"
        }
    ],
    "attributes": [
        "temperature", "pressure"
    ],
    "reference": "http://localhost:1028/mirror",
    "duration": "P1M",
    "notifyConditions": [
        {
            "type": "ONCHANGE",
            "condValues": [
                "temperature", "pressure"
            ]
        }
    ],
    "throttling": "PT5S"
}
EOF
```

```
{
    "subscribeResponse": {
        "duration": "P1M",
        "subscriptionId": "56cc2b2d981044052d2e160e",
        "throttling": "PT5S"
    }
}
```

server log
```
POST /mirror
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

### Add new aggregate temperature parameter
```
(curl localhost:1026/v1/updateContext -s -S --header 'Content-Type: application/json' \
     --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "contextElements": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab",
            "attributes": [
                {
                    "name": "temperature-history",
                    "type": "array",
                    "value": "[]"
                }
            ]
        }
    ],
    "updateAction": "APPEND"
}
EOF
```

```
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "temperature-history",
                        "type": "array",
                        "value": ""
                    }
                ],
                "id": "lab",
                "isPattern": "false",
                "type": "Room"
            },
            "statusCode": {
                "code": "200",
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

### Subscribe for temperature aggregation
```
(curl localhost:1026/v1/subscribeContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Room",
            "isPattern": "false",
            "id": "lab"
        }
    ],
    "attributes": [
        "temperature", "pressure"
    ],
    "reference": "http://localhost:1028/aggregate-temperature",
    "duration": "P1M",
    "notifyConditions": [
        {
            "type": "ONCHANGE",
            "condValues": [
                "temperature", "pressure"
            ]
        }
    ],
    "throttling": "PT5S"
}
EOF
```

```
{
    "subscribeResponse": {
        "duration": "P1M",
        "subscriptionId": "56ced42b981044052d2e1611",
        "throttling": "PT5S"
    }
}
```
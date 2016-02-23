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
- Amazon AMI `Basic IoT Stack powered by FIWARE v0.2.0 (ami-a97919de)`
- SSH into the instance

### Create room "lab"
```json
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

```json
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
```json
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

```json
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
```json
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

```json
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
```json
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

```json
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
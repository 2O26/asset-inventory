# AssetHandler API

## AssetHandler runs on port 8080 by default, and has the following endpoints:

### GET /getLatestState
getLatestState returns the latest state of the inventory.
When the function is called, the latest data from the network scan is fetched and the assets present in the inventory are fused together with the plugin data with the jsonhandler.BackToFront function.
The output is a JSON document that complies with the following schema:

```yaml
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "https://example.com/product.schema.json",
  "title": "Asset inventory Schema",
  "description": "A state retrieved from /getLatestState",
  "type": "object",
  "properties": {
    "message": {
      "description": "A message containing information that isn't the state, such as Authentication status.",
      "type": "string"
    },
    "state": {
      "description": "The state of the inventory.",
      "type": "object",
      "properties": {
        "mostRecentUpdate": {
          "description": "The timestamp for the latest update of the state.",
          "type": "string",
          "format": "date-time"
        },
        "assets": {
          "description": "A map containing all assets present in the state.",
          "type": "object",
          "additionalProperties": {
            "description": "The ID of an asset in the asset inventory.",
            "type": "object",
            "properties": {
              "Name": {
                "description": "The name of an asset.",
                "type": "string"
              },
              "Owner": {
                "description": "The name of the asset's owner.",
                "type": "string"
              },
              "Type": {
                "Description": "An array containing the type(s) of an asset.",
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "Created at": {
                "description": "Time when asset was created.",
                "type": "string",
                "format": "date-time"
              },
              "Updated at": {
                "description": "Time when asset was created.",
                "type": "string",
                "format": "date-time"
              },
              "Criticality": {
                "description": "Criticality of asset.",
                "type": "integer"
              },
              "Hostname": {
                "description": "IP of asset (if applicable). Will be updated in the future.",
                "type": "string"
              }
            }
          },
          "propertyNames": {
            "pattern": "^[0-9]+$"                 
          },
          "plugins": {
            "description": "A map containing all plugin information related to an asset.",
            "type": "object",
            "string": {
              "description": "The name of a given plugin.",
              "type": "object"
            }
          }
        },
        "relations": {
          "description": "Map containing all relations of all assets in the state.",
          "type": "object",
          "properties": {
            "additionalProperties": {
              "description": "Relation ID.",
              "type": "object",
              "properties": {
                "from": {
                  "description": "Asset ID of the asset the relation comes from.",
                  "type": "string"
                },
                "to": {
                  "description": "Asset IF of the asset the relation goes to.",
                  "type": "string"
                },
                "direction": {
                  "description": "Property that defines if relation is unidirectional or bidirectional. Must be set to either uni or bi.",
                  "type": "string",
                  "enum": [
                    "uni",
                    "bi"
                  ]
                },
                "owner": {
                  "description": "Name of relation's owner.",
                  "type": "string"
                },
                "dateCreated": {
                  "description": "Timestamp of when the relation was created.",
                  "type": "string",
                }
              }
            },
            "propertyNames": {
              "pattern": "^[0-9]+$"
            }
          }
        },
        "pluginList": {
          "description": "Names of all plugins present in the current state.",
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }
  }
}
```
It's worth noting that plugin data can not take any form, and needs to adhere to this schema:

```yaml
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "https://example.com/product.schema.json",
  "title": "Plugin data schema",
  "description": "Format for data retrieved from any plugin.",
  "type": "object",
  "properties": {
    "StateID": {
      "description": "ID of plugin's current state.",
      "type": "string"
    },
    "DateCreated": {
      "description": "Creation date of plugin state.",
      "type": "string",
      "format": "date-time"
    },
    "DateUpdated": {
      "description": "Time of most recent update.",
      "type": "string",
      "format": "date-time"
    },
    "State": {
      "description": "The plugin data, on a per-asset basis.",
      "type": "object",
      "properties": {
        "^[0-9]+$": {
          "description": "Asset ID.",
          "type": "object"
        }
      }
    }
  }
}
```
Both schemas can be found in `getLatestState_schema.json` and `plugindata_schema.json`, respectively.

### POST /AddScan
AddScan takes a backend state as its argument and adds it to the database as the most recent state.
Backend states are on a different format to the output from /getLatestState and must be compliant to the following schema:

```yaml
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "https://example.com/product.schema.json",
  "title": "Asset inventory backend state schema",
  "description": "A state as retrieved from the AssetHandler database",
  "type": "object",
  "properties": {
    "id": {
      "description": "ID of a state as taken directly from the AssetHandler database.",
      "type": "string"
    },
    "mostRecentUpdate": {
      "description": "Timestamp of most recent update.",
      "type": "string"
    },
    "assets": {
      "description": "Map of all assets present in state",
      "type": "object",
      "patternProperties": {
        "^[0-9]+$": {
          "description": "Asset ID.",
          "type": "object",
          "properties": {
            "Name": {
              "description": "Name of asset.",
              "type": "string"
            },
            "Owner": {
              "description": "Owner of asset.",
              "type": "string"
            },
            "Type": {
              "description": "Type(s) of asset.",
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "Created at": {
              "description": "Timestamp of asset creation.",
              "type": "string"
            },
            "Updated at": {
              "description": "Timestamp of most recent asset update.",
              "type": "string"
            },
            "Criticality": {
              "description": "Criticality of asset.",
              "type": "integer"
            },
            "IP": {
              "description": "IP address of asset (if applicable).",
              "type": "string"
            }
          }
        }
      }
    },
    "relations": {
      "description": "Map of all relations currently present in the inventory.",
      "type": "object",
      "patternProperties": {
        "^[0-9]+$": {
          "description": "Asset IDs.",
          "type": "object",
          "properties": {
            "from": {
              "description": "Asset ID of the asset the relation comes from.",
              "type": "string"
            },
            "to": {
              "description": "Asset ID of the asset the relation goes to.",
              "type": "string"
            },
            "direction": {
              "description": "Property that defines if relation is unidirectional or bidirectional. Must be set to either uni or bi.",
              "type": "string",
              "enum": [
                "uni",
                "bi"
              ]
            },
            "owner": {
              "description": "Name of relation's owner.",
              "type": "string"
            },
            "dateCreated": {
              "description": "Timestamp of when the relation was created.",
              "type": "string"
            }
          }
        }
      }
    },
    "pluginStates": {
      "description": "States of all plugins present in the current state.",
      "type": "object",
      "properties": {
        "string":{
          "description": "Name of plugin",
          "type": "object",
          "properties": {
            "stateID": {
              "description": "ID of plugin's current state.",
              "type": "string"
            },
            "dateCreated": {
              "description": "Timestamp of plugin state's creation.",
              "type": "string"
            },
            "dateUpdated": {
              "description": "Timestamp of plugin state's most recent update.",
              "type": "string"
            },
            "state":{
              "description": "Plugin state data.",
              "type": "object",
              "patternProperties": {
                "^[0-9]+$": {
                  "description": "Plugin asset's ID.",
                  "type": "object"
                }
              }
            }
          }
        }
      }
    }
  }
}
```
### POST /assetHandler
This endpoint manages assets and relationships based on the provided request. It allows adding, updating, and removing assets and their relationships.

#### Request
- **Method**: POST
- **URL**: `/assetHandler`
- **Content-Type**: `application/json`
- **Body**:
  A JSON object detailing the asset and relationship modifications to perform.

**Example Request Body**:
```json
{
    "addAsset": [
        {
            "name": "New PS5",
            "owner": "IT Department",
            "type": [
                "Gaming Console",
                "PlayStation"
            ],
            "criticality": 5
        },
        {
            "name": "My iPhone",
            "owner": "IT Department",
            "type": [
                "Mobile",
                "iOS"
            ],
            "criticality": 3
        }
    ],
    "removeAsset": [
        "65f8671cfe55e5c76465d841",
        "65fb497f691fc662e"
    ],
    "updateAsset": {
        "65f8671cfe55e5c76465d843": {
            "name": "Work Laptop",
            "owner": "UID_6372",
            "type": [
                "Laptop",
                "Windows"
            ],
            "criticality": 1
        },
        "65f8671cfe5565d878": {
            "name": "Work Laptop",
            "owner": "UID_6372",
            "type": [
                "Laptop",
                "Windows"
            ],
            "criticality": 4
        }
    },
    "addRelations": [
        {
            "from": "65f8671cfe55e5c76465d842",
            "to": "45394445419413510",
            "direction": "uni",
            "owner": "UID_6372"
        },
        {
            "from": "6615e79bbbb65",
            "to": "6576465d842",
            "direction": "uni",
            "owner": "UID_6372"
        }
    ],
    "removeRelations": [
        "661555a5e79bb8366e78bb66",
        "65f8671c5e5c76"
    ]
}
```
### Successful Response Example:

**HTTP Status Code**: 200 OK

**Content**:

```json
{
  "messages": ["Asset added successfully", "Relation added successfully"],
  "errors": []
}
```
### Error Responses
**400 Bad Request:**
**Content**: `{"error": "Invalid request data: <error details>"}`
- **Description:** Returned when the request body cannot be parsed or fails validation checks.

**500 Internal Server Error:**
**Content:** ```{"error": "Failed to update database entries"}```
- **Description:** Returned if there is a failure during the database update operations.


## GET /printAllDocuments

### Description
printAllDocuments retrieves all documents from the asset inventory timeline database.
### Request
- **Method**: GET
- **URL**: `/printAllDocuments`

### Response
The response includes all documents found in the database.

### Successful Response Example
**HTTP Status Code**: 200 OK  
**Content**: JSON array containing all documents.

### Error Responses
- **500 Internal Server Error**
  - **Content**: `{"error": "Error fetching documents"}`
  - **Description**: Returned when the database operation fails to retrieve documents.

## GET /deleteAllDocuments

### Description
deleteAllDocuments deletes all documents from the asset inventory timeline database.

### Request
- **Method**: GET
- **URL**: `/deleteAllDocuments`

### Response
Confirms the deletion of documents and provides a count of how many documents were deleted.

### Successful Response Example
**HTTP Status Code**: 200 OK  
**Content**: `{"message": "Documents deleted", "count": X}`
- X represents the number of documents deleted.

### Error Responses
- **500 Internal Server Error**
  - **Content**: `{"error": "Error deleting documents"}`
  - **Description**: Returned when the database operation fails to delete the documents.

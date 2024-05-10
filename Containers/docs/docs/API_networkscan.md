# NetworkScan API
## NetworkScan runs on port 8081 by default, and has the following endpoints:

## GET /getLatestScan

### Description

getLatestScan retrieves the most recent scan from the asset-inventory scan database. It returns the latest state of the network scan based on the mostRecentUpdate field.
### Request
- **Method**: GET
- **URL**: `/getLatestScan`

### Response
The response is a JSON document that follows to the Asset inventory backend scan state schema. This schema details the properties of the retrieved state including identifiers, property types, creation and update timestamps.

**Content**:
```yaml
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "https://example.com/product.schema.json",
  "title": "Asset inventory backend state schema",
  "description": "A state as retrieved from the network scan database",
  "type": "object",
  "properties": {
    "StateID": {
      "type": "string"
    },
    "DateCreated": {
      "type": "string"
    },
    "DateUpdated": {
      "type": "string"
    },
    "State": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "uid": {
            "type": "string"
          },
          "Status": {
            "type": "string",
            "enum": ["up", "down"]
          },
          "IPv4 Address": {
            "type": "string",
            "format": "ipv4"
          },
          "Last Discovered at": {
            "type": "string"
          },
          "Open Ports": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "propertyNames": {
        "pattern": "^[0-9]+$"
      }
    }
  }
}
```
### Error Responses

- **404 Not Found**
  - **Content**: `{"error": "No scans found"}`
  - **Description**: This error is returned when there are no scans available in the database to retrieve. This indicates that the database is empty.

- **500 Internal Server Error**
  - **Content**: `{"error": "Error while retrieving the latest scan"}`
  - **Description**: Returned when the database operation fails to retrieve documents. This may occur due to a failure within the database operation, such as a connectivity issue or data corruption.

## POST /startNetScan

### Description
startNetScan initiates a network scan over specified IP ranges. It processes each target defined in the request, performs ping sweeps, and optionally port scans, depending on the command selection provided. The results are stored and can be retrieved using other endpoints such as `/getLatestScan`.

### Request
- **Method**: POST
- **URL**: `/startNetScan`
- **Body Format**: JSON
  - **Content Example**:
    ```json
    {
        "cmdSelection": "simple",
        "IPRanges": [192.168.50.220/32:true]
    }
    ```

### Response
Upon successful completion of the network scanning operation, startNetScan provides a confirmation message and indicates success.

### Successful Response Example
**HTTP Status Code**: 200 OK  
**Content**: 
```json
{
  "message": "Scan performed successfully",
  "success": true
}
```
## GET /printAllDocuments

### Description
printAllDocuments retrieves all documents from the asset inventory scan database.
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
deleteAllDocuments deletes all documents from the asset inventory scan database.

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


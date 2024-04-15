
# CycloneDX API
## CycloneDX runs on port 8082 by default, and has the following endpoints:

## POST uploadCycloneDX
### Description 
Accepts a CycloneDX SBOM (Software Bill of Materials) file either in JSON or XML format and saves it to the database. If the uploaded file is XML, it is converted to JSON. The assetID is then sent to the CVE Scanner as a trigger to start scanning the SBOM file for vulnerabilities.

### Request
- **Method**: POST
- **URL**: /uploadCycloneDX
- **Accepted Content Types**: application/json, text/xml
-   **Form Data**:
    -   `file`: The CycloneDX file in JSON or XML format.
    -   `assetID`: Identifier for the asset which the SBOM document was uploaded on.
-   **Success Response**:
    -   **Code**: 200 OK
    -   **Content**: `{"message": "File uploaded successfully: <filename>"}`
-   **Error Response**:
    -   **Code**: 400 Bad Request / 500 Internal Server Error
    -   **Content**: `{"error": "<error message>"}`

## POST /removeCycloneDX
### Description
Removes a specified CycloneDX file from the database using the asset ID provided.

### Request
- **Method**: POST
- **URL**: /removeCycloneDX
-   **Form Data**:
    -   `assetID`: Identifier for the asset whose CycloneDX file is to be removed.
-   **Success Response**:
    -   **Code**: 200 OK
    -   **Content**: `{"message": "CycloneDX file removed."}`
-   **Error Response**:
    -   **Code**: 500 Internal Server Error
    -   **Content**: `{"error": "Failed to remove SBOM from database."}`

## GET /getCycloneDXFile
### Description
Retrieves a CycloneDX file from the database using the asset ID provided.

### Request
- **Method**: GET
- **URL**: /getCycloneDXFile
-   **Form Data**:
    -   `assetID`: Identifier for the asset.
-   **Success Response**:
    -   **Code**: 200 OK
    -   **Content Type**: `application/json`
    -   **Content**: CycloneDX SBOM JSON data
-   **Error Response**:
    -   **Code**: 404 Not Found / 500 Internal Server Error
    -   **Content**: `{"error": "<error message>"}`

## GET /PrintAllDocuments
### Description 
Prints all CycloneDX documents stored in the database.

### Request
-   **Method**: `GET`
-   **URL**: `/PrintAllDocuments`
-   **Success Response**:
    -   **Code**: 200 OK
    -   **Content**: List of all CycloneDX documents
-   **Error Response**:
    -   **Code**: 500 Internal Server Error
    -   **Content**: `{"error": "Error fetching documents"}`

## GET /DeleteAllDocuments
### Description
Deletes all CycloneDX documents stored in the database.

### Request   
-   **Method**: `GET`
-   **URL**: `/DeleteAllDocuments`
-   **Success Response**:
    -   **Code**: 200 OK
    -   **Content**: `{"message": "Documents deleted", "count": <number of documents deleted>}`
-   **Error Response**:
    -   **Code**: 500 Internal Server Error
    -   **Content**: `{"error": "Error deleting documents"}`

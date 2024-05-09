
# API CVE scanner microservice

## Function: LibraryDBupdate
This endpoint is triggered when a new Software Bill of Materials (SBOM) is uploaded to the CycloneDX backend. It handles updating the library database with new or modified library data extracted from the SBOM.

#### Workflow
1. **Validate Input:** The `assetID` from the request body is validated to ensure it is a non-empty string.
2. **Fetch SBOM Data:** A GET request is made to the CycloneDX service to retrieve the SBOM file corresponding to the provided `assetID`. If the SBOM cannot be fetched (e.g., server error or asset ID not found), the update process is halted, and an error is returned.
3. **Remove Existing Entries:** Before updating the database, any existing references to the `assetID` in the library database are removed. This step ensures that the database reflects the latest state of the SBOM.
4. **Process Libraries from SBOM:** The SBOM data is parsed, and each library component is processed:
   - If a library with the same package URL (purl) already exists in the database, the `assetID` is added to its list of associated asset IDs.
   - If the library is new, it is added to the database with the current `assetID` as its initial associated asset ID.
5. **Save Changes:** Changes to the library database are saved. This operation includes updating existing entries and adding new ones. The save operation is performed partially to ensure that the API remains responsive, even if some library entries take longer to process due to external API calls or other delays.
6. **Log Update Status:** The update process logs both the previous state of the library database and the newly fetched SBOM data for debugging and verification purposes.
7. **Error Handling:** If any part of the update process fails (e.g., during database operations or data fetching), an error is logged, and the process is halted. The error is propagated upwards, allowing for external handling or logging.

#### Additional Operations
- **Check for Vulnerabilities:** After updating the library database, a separate function checks for vulnerabilities associated with the new or updated libraries.

#### Error Handling
Errors during the update process are caught and handled explicitly. The response to the client includes a status code of 500 (Internal Server Error) if an error occurs, along with a message indicating that an error occurred during request processing.

#### Notes
- The process is designed to handle asynchronous operations and ensures that the database state is consistent with the latest SBOM data.
- Security and error handling are emphasized to prevent inconsistent states and ensure reliable operation under various conditions.
- The documentation and code comments provide insight into the expected behavior and possible points of failure, facilitating maintenance and further development.

## Function: CheckIfVulnerabilities

This function checks for vulnerabilities associated with all libraries linked to a specific asset ID by invoking an external CVE (Common Vulnerabilities and Exposures) checking service.

#### Description

`CheckIfVulnerabilities` is designed to perform several key operations as part of the vulnerability scanning process for a given asset:

1. **Retrieve Package URLs (purls):** It fetches all the purls associated with the specified `assetID`. This step is crucial as it determines which libraries need to be checked for vulnerabilities.
2. **API Key Retrieval:** Retrieves the necessary API key for accessing the Sonatype OSS Index, which is used to check for vulnerabilities. This key is required to authenticate API requests.
3. **Process Vulnerability Check in Batches:** Since the external API has a limit on the number of components that can be checked in a single request (128 components), the purls are processed in batches. Each batch of up to 128 purls is sent to the CVE checking service.
4. **Aggregation of Vulnerability Data:** The responses from the CVE service are aggregated. Only the components that are reported to have vulnerabilities are retained.
5. **Database Update:** The results, which include the purls and their associated vulnerabilities, are then added to the database. This step ensures that the vulnerability data is stored and can be referenced in future security audits or checks.
6. **Error Handling:** The function includes error handling to manage exceptions that may arise during the API calls or database operations. This is crucial for maintaining robustness and reliability.


## Authentication and sonatype OSS index rest api:
* If `api-token` and `username` are conficured in `CVE Scan Settings`, the CVE scan will run authenticated. This will enable a higher request limit to the OSS index rest api.
* If NO `api-token` or `username` is configured in `CVE Scan Settings`, the CVE scan will run UN-authorized. Thereof there will be a lower rate limit of using the rest api to Sonatype OSS index, but the scaner will still work as usual.

```js
async function checkVulnerabilities(purl, apikey) {
    /*
        Check CVEs for libraries attached in the parameter against the Sonatype OSS index
    */

    const apiUrl = `https://ossindex.sonatype.org/api/v3/component-report`;
    const apiAuthUrl = `https://ossindex.sonatype.org/api/v3/authorized/component-report`;
    const component = purl;

    try {
        if (apikey != "") {
            const response = await axios.post(apiAuthUrl, { coordinates: component }, {
                headers: {
                    authorization: `Basic ${apikey}`
                },
                timeout: 10000  // Timeout after 10 seconds
            });
            return response.data;
        } else {
            const response = await axios.post(apiUrl, { coordinates: component }, {
                timeout: 10000  // Timeout after 10 seconds
            });
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching vulnerability data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}
```

As shown above two different API calls are being used to connect with the Sonartype Rest API depending on if you have configured `api-token` and `username` or not.

See documnetation at:  [https://ossindex.sonatype.org/rest](URL)

### How to find API token and username:
1. Visit [https://ossindex.sonatype.org/](URL)
2. Create an account and sig in
3. Navigate to your user settings: [https://ossindex.sonatype.org/user/settings](URL)
4. Under "Email Address" in the top middle section of the page, find your username.
5. In the middle section at the bottom of the page find your API Token. 

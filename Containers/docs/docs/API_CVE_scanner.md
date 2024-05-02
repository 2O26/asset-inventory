

<!-- ### /libraryDBupdate
Launched from the cycloneDX backend when a new SBOM is added.
- [x] Make a GET request to fetch the SBOM file of given asset
- [x] If assetID exists on any libraries, remove the entries. Alternatively remove the entire entry
- [x] Check if purl already exists in CVE library database.
    - [x] If yes, add the asset to the list
    - [x] If no, add a new library entry.
- [x] Partial save of the libraries to DB (We dont want to wait for all the external API calls to have functionality of library DB)
- [] API call to check CVEs for the new library entries (create call, just check conn and then exit func)
- [x] Make a GET request to fetch the SBOM file of given asset
- [x] If assetID exists on any libraries, remove the entries. Alternatively remove the entire entry
- [x] Check if purl already exists in CVE library database.
    - [x] If yes, add the asset to the list
    - [x] If no, add a new library entry.
- [x] Partial save of the libraries to DB (We dont want to wait for all the external API calls to have functionality of library DB)
- [x] API call to check CVEs for the new library entries (create call, just check conn and then exit func)

### /recheckVulnerabilitiesAll

POST request here to update the CVE database for the libraries

- [x] For each library + version combo
    - [x] Run function that invokes an external API call to check for CVEs -->


### Authentication and sonatype OSS index rest api:
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

See documnetation at: https://ossindex.sonatype.org/rest 
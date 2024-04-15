
const axios = require('axios');
const CVEscanSave = require("../DatabaseConn/CVEconn");


async function getAPIkey() {
    const url = "http://confighandler:3001/getOSSAPIkey"
    try {
        const apikeyResponse = await axios.get(url);
        if (apikeyResponse.status !== 200) {
            console.log("Could not fetch apikey")
            return ""
        }
        return apikeyResponse.data.apikey;

    } catch (error) {
        console.error('Error during API call:', error);
        return "";
    }
}

async function checkVulnerabilities(purl, apikey) {
    const apiUrl = `https://ossindex.sonatype.org/api/v3/component-report`;
    const component = purl;

    try {
        const response = await axios.post(apiUrl, { coordinates: component }, {
            headers: { 'Authorization': `Bearer ${apikey}` },
            timeout: 10000  // Timeout after 10 seconds
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching vulnerability data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

async function getPurlsOfAssetID(assetID) {
    // Get all the purl:s associated with the given asset-id
    const cveSave = new CVEscanSave();
    return cveSave.connect()
        .then(() => cveSave.getPurls(assetID))  // Execute getPurls after successful connection
        .then(result => {
            // console.log(result); // Logs the result before returning
            return result;  // Returns the result to the caller
        })
        .catch(err => {
            console.log("Could not get purls: ", err);
            return [];  // Return an empty array in case of error
        });
}

async function processPurlsInBatches(purl_list, apikey, batchSize) {
    /*
        Response data: { code: 400, message: 'Request for more than 128 components' }
        Thus we have to divide the libraries to batches of 128 and accumulate the results to an object
    */
    let accumulatedResult = [];  // This could also be an array or any other data structure

    for (let i = 0; i < purl_list.length; i += batchSize) {
        const batch = purl_list.slice(i, i + batchSize);
        const batchResult = await checkVulnerabilities(batch, apikey);  // Process each batch and expect a result
        // Accumulate results; merge or concatenate based on your data structure
        // push array of objects
        accumulatedResult.push(batchResult);
    }
    return accumulatedResult;  // Return the final accumulated results
}

async function CVEcheck(assetID) {
    try {
        const apikey = await getAPIkey();
        if (apikey === "") {
            console.log("Erronous api key or could not fetch it from settings")
            return {}
        }
        console.log("API KEY: ", apikey);

        const purl_list = await getPurlsOfAssetID(assetID);
        const OSSresponses = await processPurlsInBatches(purl_list, apikey, 128);
        // Reduce to an array of library objects that contain CVEs
        const componentsWithVulnerabilities = OSSresponses.flatMap(subArray =>
            subArray.filter(component => component.vulnerabilities && component.vulnerabilities.length > 0)
        );
        const objectivizedComponentsWithVulnerabilities = {}
        componentsWithVulnerabilities.forEach(component => {
            // objectivizedComponentsWithVulnerabilities[component.coordinates] = JSON.stringify(component.vulnerabilities, null, 2)
            objectivizedComponentsWithVulnerabilities[component.coordinates] = component.vulnerabilities;
            // console.log('Coordinate:', component.coordinates);
            // console.log('Vulnerabilities:', JSON.stringify(component.vulnerabilities, null, 2));
        })
        // console.log(objectivizedComponentsWithVulnerabilities)

        return objectivizedComponentsWithVulnerabilities;
    } catch (err) {
        console.error('Error scanning CVEs:', err.message);
        return {};
    }
}

module.exports = { CVEcheck };

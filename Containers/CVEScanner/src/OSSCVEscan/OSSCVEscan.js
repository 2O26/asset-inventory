const axios = require('axios');
const CVEscanSave = require("../DatabaseConn/CVEconn");


async function getAPIkey() {
    const url = 'http://confighandler:3001/getOSSAPIkeyInternal';
    try {
        const response = await axios.get(url);
        if (response.status !== 200) {
            return ""
        }
        return response.data.apikey;
    } catch (error) {
        return ""
    }
}

async function checkAPIkey(apiKey) {
    try {
        const apiResponse = await axios.get('https://ossindex.sonatype.org/api/v3/version', {
            headers: {
                'accept': 'application/json',
                'Authorization': `Basic ${apiKey}`
            }
        });
        if (apiResponse.status == 200) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

async function CheckVulnerabilities(component, apiKey) {
    /*
        Check CVEs for libraries attached in the parameter against the Sonatype OSS index
    */

    const apiUrl = `https://ossindex.sonatype.org/api/v3/component-report`;
    const apiAuthUrl = `https://ossindex.sonatype.org/api/v3/authorized/component-report`;

    try {
        if (apiKey != "") {
            const response = await axios.post(apiAuthUrl, { coordinates: component }, {
                headers: {
                    authorization: `Basic ${apiKey}`
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
        console.error('Error fetching vulnerability data:', error);
        throw error;
    }
}

async function CheckVulnerabilitiesForAll() {
    /*
        Mother function to check all libraries for CVEs
    */
    try {
        let apiKey = await getAPIkey();

        const authenticated = await checkAPIkey(apiKey);

        if (!authenticated) {
            apiKey = ""
        }

        const purlList = await getAllPurls();
        if (!purlList.length) {
            console.log("No PURLs available for processing.");
            return {};
        }
        const openSourceResponses = await processPurlsSequentially(purlList, apiKey, 128);
        const vulnerabilitiesMap = reduceToVulnerabilitiesMap(openSourceResponses);
        console.log("Amount of Vulnerable Libraries: ", Object.keys(vulnerabilitiesMap).length);
        return vulnerabilitiesMap;
    } catch (err) {
        console.error('Error scanning CVEs:', err.message);
        return {};
    }
}

async function getPurlsOfAssetID(assetID, dbConnector = new CVEscanSave()) {
    try {
        await dbConnector.connect();
        const result = await dbConnector.getPurls(assetID);
        return result;
    } catch (err) {
        console.error("Could not get purls for asset ID " + assetID + ": ", err);
        throw err;  // Return an empty array in case of error
    }
}

async function getAllPurls(dbConnector = new CVEscanSave()) {
    /*
    Get all the purl:s associated with the given asset-id
*/
    try {
        await dbConnector.connect();
        const result = await dbConnector.getAllPurls();
        return result;
    } catch (err) {
        console.error("Could not get all PURLs: ", err);
        throw err;  // Return an empty array in case of error
    }
}

async function processPurlsSequentially(purlList, apiKey, batchSize) {
    const results = [];

    for (let i = 0; i < purlList.length; i += batchSize) {
        const batch = purlList.slice(i, i + batchSize);
        try {
            const result = await CheckVulnerabilities(batch, apiKey);
            results.push(result);  // Collect results from each batch
        } catch (err) {
            console.error('Error processing batch:', err);
            throw err;  // Stop processing and throw the error
        }
    }
    return results;
}

function reduceToVulnerabilitiesMap(OSSresponses) {
    const componentsWithVulnerabilities = OSSresponses.flatMap(response =>
        response.filter(component => component.vulnerabilities && component.vulnerabilities.length > 0)
    );

    return componentsWithVulnerabilities.reduce((acc, component) => {
        if (acc[component.coordinates]) {
            // If the component already exists, concatenate new vulnerabilities
            acc[component.coordinates] = acc[component.coordinates].concat(component.vulnerabilities);
        } else {
            // Otherwise, just set the vulnerabilities for this component
            acc[component.coordinates] = component.vulnerabilities;
        }
        return acc;
    }, {});
}


async function CheckVulnerabilitiesForAsset(assetID) {
    /*
        Mother function to check libraries associated with a specific asset for CVEs
    */
    try {
        let apiKey = await getAPIkey();

        const authenticated = await checkAPIkey(apiKey);

        if (!authenticated) {
            apiKey = ""
        }

        const purlList = await getPurlsOfAssetID(assetID);
        if (!purlList.length) {
            throw new Error("No PURLs found for the asset.");
        }
        const OSSresponses = await processPurlsSequentially(purlList, apiKey, 128);
        const vulnerableComponents = filterVulnerableComponents(OSSresponses);
        const vulnerabilitiesMap = mapVulnerabilities(vulnerableComponents);
        console.log("Amount of Vulnerable Libraries: ", Object.keys(vulnerabilitiesMap).length);
        return vulnerabilitiesMap;
    } catch (err) {
        console.error('Error scanning CVEs:', err.message);
        throw err;
    }
}

function filterVulnerableComponents(OSSresponses) {
    return OSSresponses.flatMap(response =>
        response.filter(component => component.vulnerabilities && component.vulnerabilities.length > 0)
    );
}

function mapVulnerabilities(vulnerableComponents) {
    return vulnerableComponents.reduce((acc, component) => {
        if (acc[component.coordinates]) {
            acc[component.coordinates] = acc[component.coordinates].concat(component.vulnerabilities);
        } else {
            acc[component.coordinates] = component.vulnerabilities;
        }
        return acc;
    }, {});
}

async function CheckIfVulnerabilities(assetID) {
    /*
        - [x] For every library + version combo that contains assetID
            - run function that invokes an external API call to check for CVEs
        - [x] Save result to database
    */
    try {
        const purlsWithVulnerbilities = await CheckVulnerabilitiesForAsset(assetID);
        const cveSave = new CVEscanSave();
        await cveSave.connect();
        await cveSave.addCVEsToPurl(purlsWithVulnerbilities);
    } catch (err) {
        console.error('Error checking vulnerabilities or saving CVE data:', err);
        throw err;
    }
}

async function CheckIfSBOMVulnsAll() {
    try {
        const purlsWithVulnerbilities = await CheckVulnerabilitiesForAll();
        const cveSave = new CVEscanSave();
        await cveSave.connect();
        await cveSave.addCVEsToPurl(purlsWithVulnerbilities);
    } catch (err) {
        console.error("Could not save purl CVE data: ", err)
        throw err;
    };
}

module.exports = {
    getAPIkey,
    CheckVulnerabilities,
    getPurlsOfAssetID,
    getAllPurls,
    processPurlsSequentially,
    CheckVulnerabilitiesForAll,
    reduceToVulnerabilitiesMap,
    CheckVulnerabilitiesForAsset,
    filterVulnerableComponents,
    mapVulnerabilities,
    CheckIfVulnerabilities,
    CheckIfSBOMVulnsAll,
    checkAPIkey
};

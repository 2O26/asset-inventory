const express = require("express");
const axios = require('axios');


const { CVEcheck } = require("./OSSCVEscan/OSSCVEscan");
const { LibraryDBupdate } = require("./librarySort");
const CVEscanSave = require("./DatabaseConn/CVEconn");


// const app = express(express.json());
const app = express();
app.use(express.json());
const cors = require("cors");


const route = 3002;

app.use(cors())

app.listen(route, () => { console.log("Server listening on port: ", route) });

app.get("/status", (req, res) => {
    console.log("\n !!! Check Status !!! \n");
    res.send("Check Status");
});

app.post("/getVulnerableAssetID", async (req, res) => {
    /*
        Given an assetID go through each library that has vulnerbilities
        check if the asset ID is listed, if so add to returning list.
        Return list of vulnerble libaries within the assets SBOM. 
    */

    try {
        // Authenticate the user and get their UID
        const authResponse = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        if (!authResponse.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        // Fetch CycloneDX file for the given asset ID


        // const cycloneDXData = await cycloneDXResponse.json();
        // const vulnerabilities = await CVEcheck(cycloneDXData);

        // Respond with the vulnerabilities found
        res.json({ success: true, cycloneDXvulns: {} });
    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.post("/getVulnerableAssetAll", async (req, res) => {
    /*
        Return object of all vulnerble libaries within the assets SBOM:s. 
    */

    try {
        // Authenticate the user and get their UID
        const authResponse = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        if (!authResponse.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        // Fetch CycloneDX file for the given asset ID


        // const cycloneDXData = await cycloneDXResponse.json();
        // const vulnerabilities = await CVEcheck(cycloneDXData);

        // Respond with the vulnerabilities found
        res.json({ success: true, cycloneDXvulns: {} });
    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.post("/librarySort", async (req, res) => {
    /*
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
        - [] API call to check CVEs for the new library entries (create call, just check conn and then exit func)
    */


    try {
        // Authenticate the user and get their UID
        // const authResponse = await axios.get('http://authhandler:3003/getUID', {
        //     headers: {
        //         'Authorization': req.headers.authorization
        //     }
        // });

        // if (!authResponse.data.authenticated) {
        //     return res.status(401).send('Invalid token');
        // }

        const assetID = req.body.assetID;
        await LibraryDBupdate(assetID, res);
        checkIfVulnerbilities(assetID);
        res.json({ Success: true });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.post("/removeAssetidLibs"), async (req, res) => {
    if (req.body.assetID) {
        removeExisting(req.body.assetID);
    }
}

app.post("/recheckVulnerabilitiesAll", async (req, res) => {
    /*
        - [] For each library + version combo
            - run function that invokes an external API call to check for CVEs
    */
})

async function checkIfVulnerbilities(assetID) {
    /*
        - [x] For every library + version combo that contains assetID
            - run function that invokes an external API call to check for CVEs
        - [x] Save result to database
    */
    console.log("Checking for vulnerabilities")
    const purlsWithVulnerbilities = await CVEcheck(assetID);
    const cveSave = new CVEscanSave();
    cveSave.connect()
        .then(() => cveSave.addCVEsToPurl(purlsWithVulnerbilities))
        .catch((err) => {
            console.log("Could not save purl CVE data: ", err)
        });
}
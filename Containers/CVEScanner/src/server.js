const express = require("express");
const axios = require('axios');

const { CheckIfVulnerabilities, CheckIfSBOMVulnsAll } = require("./OSSCVEscan/OSSCVEscan");
const { LibraryDBupdate } = require("./LibraryDBUpdate");
const CVEscanSave = require("./DatabaseConn/CVEconn");

const app = express();
app.use(express.json());
const cors = require("cors");
const route = 3002;
app.use(cors())
const server = app.listen(route, () => { console.log("Server listening on port: ", route) });

app.get("/status", (req, res) => {
    console.log("\n !!! Check Status !!! \n");
    res.send("Check Status");
});

app.get("/getAllLibraries", async (req, res) => {
    /*
        Return all libraries from libraries DB.
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

        const cveSave = new CVEscanSave();
        cveSave.connect();
        const libraries = await cveSave.getAllLibraries();
        res.json({ success: true, libraries: libraries });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.get("/checkAPIkey", async (req, res) => {

    console.log("checking API key!!!: ", req.headers.authorization);
    try {
        const apiResponse = await axios.get('https://ossindex.sonatype.org/api/v3/version', {
            headers: {
                'accept': 'application/json',
                'Authorization': req.headers.authorization // Ensure this matches the format used in the curl command
            }
        });
        res.json(apiResponse.data); // Send only the data part of the response
    } catch (error) {
        console.error('Error while processing request:', error);
        if (error.response) {
            // Handle the case where the server responds with a status outside the 2xx range
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
            console.error('Headers:', error.response.headers);
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request data:', error.request);
            res.status(500).send("No response received");
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            res.status(500).send(error.message);
        }
    }
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

        const assetid = req.body.assetID;
        // Check if assetID is provided and is not empty
        if (!assetid || assetid.trim().length === 0) {
            // If assetID is empty, throw an error that will be caught by the catch block
            throw new Error("Asset ID is empty");
        }
        const cveSave = new CVEscanSave();
        cveSave.connect();
        const libraries = await cveSave.getVulnerableAssetIDLibraries(assetid)
        res.json({ success: true, cycloneDXvulns: libraries });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.get("/getVulnerableAssetAll", async (req, res) => {
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
        const cveSave = new CVEscanSave();
        cveSave.connect();
        const libraries = await cveSave.getVulnerableAllLibraries();
        res.json({ success: true, cycloneDXvulns: libraries });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.post("/libraryDBupdate", async (req, res) => {
    try {
        const assetID = req.body.assetID;
        if (!assetID || assetID.trim().length === 0 || typeof assetID !== 'string') {
            throw new Error("Asset ID is empty");
        }
        const updateMessage = await LibraryDBupdate(assetID);
        await CheckIfVulnerabilities(assetID);
        res.json({ success: true });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.post("/removeAssetidLibs", async (req, res) => {

    try {
        const authResponse = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!authResponse.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        const assetID = req.body.assetID;
        if (!assetID || assetID.trim().length === 0 || typeof assetID !== 'string') {
            throw new Error("Asset ID is empty");
        }
        const cveSave = new CVEscanSave();
        cveSave.connect();
        await cveSave.removeExistingAssetIDOccurances(assetID);
        res.json({ success: true });
    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.get("/recheckVulnerabilitiesAll", async (req, res) => {
    try {
        // No authtoken check as this API call is internal!
        await CheckIfSBOMVulnsAll();
        res.json({ success: true });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
})


module.exports = { app, server };
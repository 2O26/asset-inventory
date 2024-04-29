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
        const cveSave = new CVEscanSave();
        cveSave.connect();
        const libraries = await cveSave.getVulnerableAssetIDLibraries(assetid)
        res.json({ success: true, cycloneDXvulns: libraries });

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
        cveSave.connect();
        const libraries = await cveSave.getVulnerableAllLibraries(assetid)
        res.json({ success: true, cycloneDXvulns: libraries });

    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

app.post("/libraryDBupdate", async (req, res) => {
    try {
        const assetID = req.body.assetID;

        try {
            await LibraryDBupdate(assetID, res);
            await CheckIfVulnerabilities(assetID);  // Only runs if the update is successful
        } catch (error) {
            console.error("Error during library update or vulnerability check: ", error);
        }
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
    await CheckIfSBOMVulnsAll();
    res.json({ Success: true });
})


module.exports = { app, server };
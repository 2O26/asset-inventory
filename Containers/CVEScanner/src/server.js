const express = require("express");
const axios = require('axios');

const { CVEcheck } = require("./CVEcheck")

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

app.post("/getVulnerable", async (req, res) => {
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
        const assetID = req.body.assetID;
        const cycloneDXResponse = await fetch(`http://cyclonedx:8082/getCycloneDXFile?assetID=${assetID}`);

        if (cycloneDXResponse.status !== 200) {
            return res.json({ success: false, message: "Failure to fetch CycloneDX data for the asset." });
        }

        const cycloneDXData = await cycloneDXResponse.json();
        const vulnerabilities = await CVEcheck(cycloneDXData);

        // Respond with the vulnerabilities found
        res.json({ success: true, cycloneDXvulns: vulnerabilities });
    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});


app.post("/checkCVEs", async (req, res) => {
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

app.post("/librarySort", async (req, res) => {
    /*
        Launched from the cycloneDX backend when a new SBOM is added.
        - Make a GET request to fetch the SBOM file of given asset
        - Given SBOM file for the asset ID
            - Map-reduce: purl as the key and library name, version, and assetID as values
        - Check if purl already exists in CVE library database. If so, add the asset to the list
        - If purl/library does not exist, create new entry in DB and call function that creates external API calls 
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
        const cycloneDXResponse = await fetch(`http://cyclonedx:8082/getCycloneDXFile?assetID=${assetID}`);

        if (cycloneDXResponse.status !== 200) {
            return res.json({ success: false, message: "Failure to fetch CycloneDX data for the asset." });
        }

        console.log("Server Asset ID: ", assetID);

        res.json({ Success: true });


    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

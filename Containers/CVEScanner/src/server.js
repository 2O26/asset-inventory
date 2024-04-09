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


        // TODO: Fetch from the database the asset data with parsed libraries, versions and subsequent CVEs 
        // TODO: Return this data

        // if (cycloneDXResponse.status !== 200) {
        //     return res.json({ success: false, message: "Failure to fetch CycloneDX data for the asset." });
        // }

        // Fetch CVE field per the Asset

        // Respond with the vulnerabilities found
        res.json({ success: true, cycloneDXvulns: {} });
    } catch (error) {
        console.error('Error while processing request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

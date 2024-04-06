const express = require("express");
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const { CVEcheck } = require("./CVEcheck")

// const app = express(express.json());
const app = express();
app.use(express.json());
const cors = require("cors");

const route = 3002;

app.use(cors())

const client = jwksClient({
    jwksUri: 'http://keycloak:8085/realms/master/protocol/openid-connect/certs'
});

app.listen(route, () => { console.log("Server listening on port: ", route) });

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

app.get("/status", (req, res) => {
    console.log("\n !!! Check Status !!! \n");
    res.send("Check Status");
});

app.post("/getVulnerble", async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
    jwt.verify(token, getKey, {}, async function (err, decoded) {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        const assetID = req.body.assetID;
        try {
            const cycloneDXresponse = await fetch('http://cyclonedx:8082/getCycloneDXFile?assetID=' + assetID.id);
            if (cycloneDXresponse.status == 200) {
                const cycloneDXdata = await cycloneDXresponse.json();
                const vulnerbilities = await CVEcheck(cycloneDXdata)

                res.json({ success: "success", cycloneDXvulns: vulnerbilities });
            } else {
                res.json({ success: "failure to fetch cyclonedx data for the asset" });
            }
        } catch (err) {
            console.log(err);
            res.json({ success: "failure" });
        }

    });

});
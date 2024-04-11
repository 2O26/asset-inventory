const express = require("express");
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// const app = express(express.json());
const app = express();
app.use(express.json());
const cors = require("cors");

const route = 3003;

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
    console.log("\n !!!! Check Status !!!! \n");
    res.send("Check Status");
});

//If authenticated will return e.g. { "authenticated": true, "userID": "adkfji2329uf2dafkds2" }
app.get("/getUID", async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
    jwt.verify(token, getKey, {}, async function (err, decoded) {
        if (err) {
            console.error("Authentication Error:", err)
            res.status(401).json({ "authenticated": false, message: 'Invalid token' });
            return;
        } else {
            console.log("Successfully authenticated (getUid): ", decoded.preferred_username)
            res.json({ "authenticated": true, "userID": decoded.sub })
        }
    });
});

//If authenticated will return e.g. { "authenticated": true, "roles": ["192.168.1.0/24", "10.0.0.0/32"], "isAdmin": true/false }
app.get("/getRoles", async (req, res) => {

    function containsNumber(str) {
        return /\d/.test(str);
    }

    const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix

    jwt.verify(token, getKey, {}, async function (err, decoded) {
        if (err) {
            console.error("Authentication Error:", err)
            res.status(401).json({ "authenticated": false, message: 'Invalid token' });
            return;
        } else {
            let subnetRoles = [];
            let isAdmin = false;

            for (const [key, role] of Object.entries(decoded.realm_access.roles)) {
                if (containsNumber(role)) {
                    subnetRoles.push(role);
                }
                if (role === "admin") {
                    isAdmin = true;
                }
            }

            console.log("Successfully authenticated (getRoles): ", decoded.preferred_username)
            res.json({ "authenticated": true, "roles": subnetRoles, "isAdmin": isAdmin })
        }
    });
});
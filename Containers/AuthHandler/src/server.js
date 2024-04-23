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

const server = app.listen(route, () => { console.log("Server listening on port: ", route) });

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            return callback(err); // Return to prevent any further execution
        }
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}


app.get("/status", (req, res) => {
    res.type('text/plain');  // This sets the Content-Type to text/plain
    res.send("Check Status");
});

//If authenticated will return e.g. { "authenticated": true, "userID": "adkfji2329uf2dafkds2" }
app.get("/getUID", async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
        jwt.verify(token, getKey, {}, function (err, decoded) {
            if (err) {
                console.error("Authentication Error:", err);
                res.status(401).json({ "authenticated": false, message: 'Invalid token' });
                return;
            }

            // Check if the sub claim is present
            if (!decoded || !decoded.sub) {
                console.error("Authentication Error: Token does not contain 'sub' claim");
                res.status(401).json({ "authenticated": false, message: 'Invalid token' });
                return;
            }

            console.log("Successfully authenticated (getUid): ", decoded.preferred_username);
            res.json({ "authenticated": true, "userID": decoded.sub });
        });
    } catch (error) {
        console.error("Error processing authentication token", error);
        res.status(401).json({ "authenticated": false, message: 'Received no authentication token' });
    }
});


//If authenticated will return e.g. { "authenticated": true, "roles": ["192.168.1.0/24", "10.0.0.0/32"], "isAdmin": true/false, "canManageAssets": true/false }
app.get("/getRoles", async (req, res) => {
    function containsNumber(str) {
        return /\d/.test(str);
    }

    try {
        const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
        jwt.verify(token, getKey, {}, function (err, decoded) {
            if (err) {
                console.error("Authentication Error:", err);
                return res.status(401).json({ "authenticated": false, message: 'Invalid token' });
            }

            // Check if the sub claim is present
            if (!decoded || !decoded.sub) {
                console.error("Authentication Error: Token does not contain 'sub' claim");
                return res.status(401).json({ "authenticated": false, message: 'Invalid token' });
            }

            // Check if the decoded token has realm_access and realm_access.roles
            if (!decoded.realm_access || !Array.isArray(decoded.realm_access.roles)) {
                console.error("Authentication Error: Token does not have 'realm_access' claim or 'roles' is not an array");
                return res.status(401).json({ "authenticated": false, message: 'Invalid token' });
            }

            let subnetRoles = [];
            let isAdmin = false;
            let canManageAssets = false;

            for (const role of decoded.realm_access.roles) {
                if (typeof role === 'string') {
                    if (containsNumber(role)) {
                        subnetRoles.push(role);
                    }
                    if (role === "admin") {
                        isAdmin = true;
                    }
                    if (role === "manage-assets") {
                        canManageAssets = true;
                    }
                }
            }

            console.log("Successfully authenticated (getRoles): ", decoded.preferred_username);
            res.json({
                authenticated: true,
                roles: subnetRoles,
                isAdmin: isAdmin,
                canManageAssets: canManageAssets
            });
        });
    } catch (error) {
        console.error("Error processing authentication token:", error);
        res.status(401).json({ "authenticated": false, message: 'Received no authentication token' });
    }
});

module.exports = { app, server, getKey };
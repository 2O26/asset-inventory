const express = require("express");
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

//const cronParser = require('cron-parser');
const Plugins = require('./Plugins.js');
const { IPRangechecker, RecurringScanFormat } = require("./formatchecker");
const ConfigHandler = require("./DatabaseConn/configdbconn");
const { IsCronDue } = require("./CronoScan");
const UserConfigHandler = require("./DatabaseConn/userConfigurationConn.js")

// const app = express(express.json());
const app = express();
app.use(express.json());
const cors = require("cors");
const mongoose = require('mongoose');

const route = 3001;

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

app.get("/getIPranges", (req, res) => {
    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getIPranges())
        .then(result => {
            res.json({ ipranges: result })
        }).catch((err) => {
            console.log('Could not fetch IP ranges from database. Error', err);
        });
});

app.post("/addIPranges", (req, res) => {
    if (IPRangechecker(req.body.iprange)) {
        const configHandler = new ConfigHandler();

        configHandler.connect()
            .then(() => configHandler.addIPrange(req.body.iprange))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to add IPrange!!", success: "success", range: req.body.iprange });
            }).catch((err) => {
                res.json({ responseFromServer: "Failure to add IPrange!!", success: "database failure", range: req.body.iprange });
            });
    } else {
        res.json({ responseFromServer: "Failure to add IPrange!!", success: "wrong format", range: req.body.iprange });
    }
});

app.post("/removeIPrange", (req, res) => {

    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.removeIPrange(req.body.iprange))
        .then(() => {
            res.json({ responseFromServer: "Succeeded to remove IPrange!", success: "success", range: req.body.iprange });
        }).catch((err) => {
            // If no document matched the IP range to be removed
            res.json({ responseFromServer: "Failure to remove IPrange due to database error.", success: "database error", range: req.body.iprange });
        });
});


app.get("/getRecurring", (req, res) => {
    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getRecurringScans())
        .then(result => {
            res.json({ recurring: result })
        }).catch((err) => {
            console.log('Could not fetch recurring scans from database. Error', err);
        });
})

app.post("/addRecurring", async (req, res) => {
    const configHandler = new ConfigHandler();
    if (RecurringScanFormat(req.body.recurring)) {
        configHandler.connect()
            .then(() => configHandler.addRecurringScan(req.body.recurring))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to add recurring scan!!", success: "success", recurring: req.body.recurring });
            }).catch((err) => {
                res.json({ responseFromServer: "Failure to add recurring scan!!", success: "database failure", recurring: req.body.recurring });
            });
    } else {
        res.json({ responseFromServer: "Failure to add recurring scan!!", success: "wrong format", recurring: req.body.recurring });
    }
});

app.post("/removeRecurring", async (req, res) => {

    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.removeRecurringScan(req.body.recurring))
        .then(() => {
            res.json({ responseFromServer: "Succeeded to remove recurring scan!", success: "success", range: req.body.recurring });
        }).catch((err) => {
            res.json({ responseFromServer: "Failure to remove recurring scan due to database error.", success: "database error", recurring: req.body.recurring });
        });

});

app.get("/getUserConfigurations", async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
    jwt.verify(token, getKey, {}, function (err, decoded) {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        // console.log(decoded.sub); // Contains user information and claims
        const userConfigHandler = new UserConfigHandler();
        userConfigHandler.connect()
            .then(() => userConfigHandler.getUserSettings(decoded.sub))
            .then(result => {
                if (result.length === 0) {
                    const defaultSetting = [{ userID: decoded.sub, leftDash: ["Graph View"], rightDash: ["Asset List"], darkmode: true }];
                    res.json({ userSettings: defaultSetting })
                } else {
                    res.json({ userSettings: result })
                }

            }).catch((err) => {
                console.log('Could not fetch user settings from database. Error', err);
            });
    });

});

app.post("/UpdateUserConfig", async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming 'Bearer ' prefix
    jwt.verify(token, getKey, {}, function (err, decoded) {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        // console.log(decoded.sub); // Contains user information and claims

        const userConfigHandler = new UserConfigHandler();
        userConfigHandler.connect()
            .then(() => userConfigHandler.updateUserSettings(decoded.sub, req.body.update))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to update user setting!", success: "success" });
            })
            .catch((err) => {
                res.json({ responseFromServer: "Failure to update user setting due to database error.", success: "database error" });
            });
    });
});

app.get("/getOSSAPIkey", (req, res) => {
    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getOSSAPIkey())
        .then(result => {
            console.log("API key", result);
            res.json({ apikey: result })
        }).catch((err) => {
            console.log('Could not fetch OSS API key from database. Error', err);
        });
})

app.post("/updateOSSAPIkey", async (req, res) => {
    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getOSSAPIkey())
        .then(oldOSSapikey => {
            configHandler.connect()
                .then(() => configHandler.updateOSSAPIkey(oldOSSapikey, req.body.apikey))
                .then(() => {
                    res.json({ responseFromServer: "Succeeded to update OSS API key!!", success: "success" });
                }).catch((err) => {
                    res.json({ responseFromServer: "Failure to update OSS API key!!", success: "database failure" });
                });
        }).catch((err) => {
            console.log('Could not fetch OSS API key from database. Error', err);
        });
});

cron.schedule('* * * * *', async () => {
    /* Every minute fetch from the database and see if any matching cron jobs */

    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getRecurringScans())
        .then(async result => {

            let IpToScanWplugin = {}
            let scanSettings = { cmdSelection: 'simple' }
            scanSettings['IpRange'] = scanSettings['IpRange'] || {};

            Object.keys(Plugins).forEach(pluginName => {
                IpToScanWplugin[pluginName] = scanSettings; // is this a shallow or hard copy. Does change to one change all?
            })

            result.forEach(recurring => {
                if (IsCronDue(recurring.time) === true) {
                    IpToScanWplugin[recurring.plugin]['IpRange'][recurring.IpRange] = true;
                }
            });

            Object.keys(IpToScanWplugin).forEach(async pluginType => {
                if (Object.keys(IpToScanWplugin[pluginType]['IpRange']).length !== 0) {
                    try {
                        // console.log(scanSettings);
                        const response = await fetch(
                            Plugins[pluginType], {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(IpToScanWplugin[pluginType])
                        });

                        const resData = await response.json();
                        return resData;
                    } catch (err) {
                        console.error(err);
                        throw new Error('Network response was not ok, could not fetch state');
                    }
                }
            });

        })
        .catch((err) => {
            console.log('Could not perform scan. Error', err);
        });

    // console.log('running a task every minute');
});
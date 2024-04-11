const express = require("express");
const cron = require('node-cron');
const axios = require('axios');

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

app.listen(route, () => { console.log("Server listening on port: ", route) });

app.get("/status", (req, res) => {
    console.log("\n !!! Check Status !!! \n");
    res.send("Check Status");
});

app.get("/getIPranges", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        const configHandler = new ConfigHandler();
        configHandler.connect()
            .then(() => configHandler.getIPranges())
            .then(result => {
                res.json({ ipranges: result })
            }).catch((err) => {
                console.log('Could not fetch IP ranges from database. Error', err);
            });

    } catch (error) {
        console.error('Error while fetching ip ranges:', error);
        res.status(500).send('Error fetching ip rangess');
    }
});

app.post("/addIPranges", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

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

    } catch (error) {
        console.error('Error while adding ip ranges:', error);
        res.status(500).send('Error adding ip rangess');
    }
});

app.post("/removeIPrange", async (req, res) => {

    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        const configHandler = new ConfigHandler();
        configHandler.connect()
            .then(() => configHandler.removeIPrange(req.body.iprange))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to remove IPrange!", success: "success", range: req.body.iprange });
            }).catch((err) => {
                // If no document matched the IP range to be removed
                res.json({ responseFromServer: "Failure to remove IPrange due to database error.", success: "database error", range: req.body.iprange });
            });
    } catch (error) {
        console.error('Error while adding ip ranges:', error);
        res.status(500).send('Error adding ip rangess');
    }
});


app.get("/getRecurring", async (req, res) => {

    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        const configHandler = new ConfigHandler();
        configHandler.connect()
            .then(() => configHandler.getRecurringScans())
            .then(result => {
                res.json({ recurring: result })
            }).catch((err) => {
                console.log('Could not fetch recurring scans from database. Error', err);
            });

    } catch (error) {
        console.error('Error while fetching recurring scans:', error);
        res.status(500).send('Error fetching recurring scans');
    }
})

app.post("/addRecurring", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

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

    } catch (error) {
        console.error('Error while adding recurring scans:', error);
        res.status(500).send('Error adding recurring scans');
    }
});

app.post("/removeRecurring", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        const configHandler = new ConfigHandler();
        configHandler.connect()
            .then(() => configHandler.removeRecurringScan(req.body.recurring))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to remove recurring scan!", success: "success", range: req.body.recurring });
            }).catch((err) => {
                res.json({ responseFromServer: "Failure to remove recurring scan due to database error.", success: "database error", recurring: req.body.recurring });
            });

    } catch (error) {
        console.error('Error while removing recurring scans:', error);
        res.status(500).send('Error removing recurring scans');
    }

});

app.get("/getUserConfigurations", async (req, res) => {
    try {
        // Retrieve user ID based on the authorization token
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // If the user is not authenticated, respond with 401 Unauthorized
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        // Initialize the UserConfigHandler to fetch user settings
        const userConfigHandler = new UserConfigHandler();
        await userConfigHandler.connect();
        const result = await userConfigHandler.getUserSettings(response.data.userID);

        // Determine the response based on whether user settings were found
        if (result.length === 0) {
            const defaultSetting = [{
                userID: response.data.userID,
                leftDash: ["Graph View"],
                rightDash: ["Asset List"],
                darkmode: true
            }];
            res.json({ userSettings: defaultSetting });
        } else {
            res.json({ userSettings: result });
        }
    } catch (error) {
        // Log the error for debugging purposes and respond with 404 Not Found
        console.error('Error while fetching user configurations:', error);
        res.status(404).send('Error fetching user configurations');
    }
});


app.post("/UpdateUserConfig", async (req, res) => {
    try {
        // Authenticate the user and get their UID
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // Check if the user is authenticated
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        // Initialize UserConfigHandler to update user settings
        const userConfigHandler = new UserConfigHandler();
        await userConfigHandler.connect();
        await userConfigHandler.updateUserSettings(response.data.userID, req.body.update);

        // Respond with success message
        res.json({ responseFromServer: "Succeeded to update user setting!", success: true });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Specific error handling for database related errors
            res.status(404).json({
                responseFromServer: "Failure to update user setting due to database error.",
                success: false,
                error: error.message
            });
        } else {
            // Generic error handling for other errors
            console.error('Error while updating user configurations:', error);
            res.status(500).send('Error updating user configurations');
        }
    }
});

app.get("/getOSSAPIkey", (req, res) => {
    console.log("Enters")
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
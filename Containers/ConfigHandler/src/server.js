const express = require("express");
const cron = require('node-cron');
const axios = require('axios');

//const cronParser = require('cron-parser');
const Plugins = require('./Plugins.js');
const { IPRangechecker, RecurringScanFormat } = require("./formatchecker");

const { PerformRecurringScan, ConnectToDatabaseAndFetchRecurringScans, PrepareToScan } = require("./CronoScan");
const UserConfigHandler = require("./DatabaseConn/userConfigurationConn.js")
const ConfigHandler = require("./DatabaseConn/configdbconn");
// const app = express(express.json());
const app = express();
app.use(express.json());
const cors = require("cors");
const mongoose = require('mongoose');

const route = 3001;

app.use(cors())

const server = app.listen(route, () => console.log(`Server listening on port: ${route}`));



app.get("/getIPranges", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }

        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const ipranges = await configHandler.getIPranges()

        if (response.data.isAdmin) {
            res.json({ ipranges: ipranges });
        } else {
            let filteredRanges = ipranges.filter(range => response.data.roles.includes(range));
            res.json({ ipranges: filteredRanges });
        }

    } catch (error) {
        res.status(500).send('Error fetching ip ranges');
    }
});

app.post("/addIPranges", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        if (IPRangechecker(req.body.iprange)) {
            console.log("!!! Enters. Valid body")
            const configHandler = new ConfigHandler();
            await configHandler.connect();
            console.log("After connect!!!")
            const response = await configHandler.addIPrange(req.body.iprange);
            console.log("After DB operation!!!")
            res.json({ responseFromServer: "Succeeded to add IPrange!!", success: "success", range: req.body.iprange });

        } else {
            throw new Error("Invalid IP format");
        }
    } catch (error) {
        console.error('Error while adding ip ranges:', error);
        res.status(500).send('Error adding ip ranges');
    }
});

app.post("/removeIPrange", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        await configHandler.removeIPrange(req.body.iprange)
        res.json({ responseFromServer: "Succeeded to remove IPrange!", success: "success", range: req.body.iprange });
    } catch (error) {
        console.error('Error removing ip range', error);
        res.status(500).send('Error removing ip range');
    }
});

app.get("/getRecurring", async (req, res) => {

    try {
        const response = await axios.get('http://authhandler:3003/getRoles', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const recurring = await configHandler.getRecurringScans();
        res.json({ recurring: recurring })

    } catch (error) {
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
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        if (!response.data.isAdmin) {
            return res.status(401).send('Unauthorized');
        }

        const configHandler = new ConfigHandler();
        if (RecurringScanFormat(req.body.recurring)) {
            await configHandler.connect();
            const resp = await configHandler.addRecurringScan(req.body.recurring)
            res.json({ responseFromServer: "Succeeded to add recurring scan!!", success: "success", recurring: req.body.recurring });
        } else {
            throw new Error("Invalid recurring format");
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
        await configHandler.connect();
        const ret = await configHandler.removeRecurringScan(req.body.recurring);
        res.json({ responseFromServer: "Succeeded to remove recurring scan!", success: "success", recurring: req.body.recurring });

    } catch (error) {
        console.error('Error while removing recurring scans:', error);
        res.status(500).send('Error removing recurring scans');
    }
});

app.get("/getUserConfigurations", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const userConfigHandler = new UserConfigHandler();
        await userConfigHandler.connect();
        const result = await userConfigHandler.getUserSettings(response.data.userID);

        // Determine the response based on whether user settings were found
        if (result.length === 0) {
            const defaultSetting = [{
                userID: response.data.userID,
                leftDash: { "Graph View": 1 },
                rightDash: { "Asset List": 1 },
                darkmode: false
            }];
            res.json({ userSettings: defaultSetting });
        } else {
            res.json({ userSettings: result });
        }
    } catch (error) {
        res.status(500).send('Error fetching user configurations');
    }
});

app.post("/UpdateUserConfig", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const userConfigHandler = new UserConfigHandler();
        await userConfigHandler.connect();
        await userConfigHandler.updateUserSettings(response.data.userID, req.body.update);
        res.json({ responseFromServer: "Succeeded to update user setting!", success: true });
    } catch (error) {
        console.error('Error while updating user configurations:', error);
        res.status(500).send('Error updating user configurations');

    }
});

app.get("/getOSSAPIkey", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const apikey = await configHandler.getOSSAPIkey()
        res.json({ apikey: apikey })
    } catch (error) {
        res.status(500).send('Error fetching OSS API key');
    }
})

app.get("/getOSSAPIkeyInternal", async (req, res) => {
    try {
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const apikey = await configHandler.getOSSAPIkey()
        res.json({ apikey: apikey })
    } catch (error) {
        res.status(500).send('Error fetching OSS API key');
    }
})

app.post("/updateOSSAPIkey", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const oldOSSapikey = await configHandler.getOSSAPIkey();
        await configHandler.updateOSSAPIkey(oldOSSapikey, req.body.apikey)
        res.json({ responseFromServer: "Succeeded to update OSS API key!!", success: "success" });

    } catch (error) {
        res.status(500).send('Error fetching OSS API key');
    }
});

app.get("/getTrelloKeys", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', { headers: { 'Authorization': req.headers.authorization } });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const trelloKeys = await configHandler.getTrelloKeys();
        res.json(trelloKeys);
    } catch (error) {
        res.status(500).send('Error fetching Trello keys');
    }
});

app.post("/updateTrelloKeys", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', { headers: { 'Authorization': req.headers.authorization } });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        await configHandler.updateTrelloKeys(req.body);
        res.json({ responseFromServer: "Succeeded to update Trello keys!", success: "success" });
    } catch (error) {
        res.status(500).send('Error updating Trello keys');
    }
});

app.post("/setDocLink", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', { headers: { 'Authorization': req.headers.authorization } });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        await configHandler.setDocLink(req.body.doclink, req.body.assetid);
        res.json({ responseFromServer: "Server.js: Succeeded to add doc link", success: "success", doclink: req.body.doclink });
    } catch (error) {
        console.error('Error while adding doc link:', error);
        res.status(500).send('Error adding doc link');
    }
});

app.post("/getDocLink", async (req, res) => {
    try {
        const response = await axios.get('http://authhandler:3003/getUID', { headers: { 'Authorization': req.headers.authorization } });
        if (!response.data.authenticated) {
            return res.status(401).send('Invalid token');
        }
        const configHandler = new ConfigHandler();
        await configHandler.connect();
        const doclink = await configHandler.getDocLink(req.body.assetid);
        res.json({ responseFromServer: "Succeeded to fetch doc link", success: "success", assetid: req.body.assetid, doclink: doclink });
        return doclink;

    } catch (error) {
        res.status(500).send('Error fetching doc link');
    }
});

const CronTask = cron.schedule('* * * * *', async () => {
    /*
        Every minute fetch from the database and see if any matching cron jobs
    */

    try {
        const recurringScans = await ConnectToDatabaseAndFetchRecurringScans();
        const ToScanWithPlugin = PrepareToScan(Plugins, recurringScans);
        const result = await PerformRecurringScan(ToScanWithPlugin);
    } catch (err) {
        console.error("Failed to run cron scan. Err: ", err);
    }
});

module.exports = { app, server, CronTask };

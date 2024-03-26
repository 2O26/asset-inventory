const express = require("express");
const { IPRangechecker, RecurringScanFormat } = require("./formatchecker");
const ConfigHandler = require("./DatabaseConn/configdbconn");
const { CronoScanAdd, CronoScanRm } = require("./CronoScan");

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

app.get("/getIPranges", (req, res) => {
    const configHandler = new ConfigHandler();
    configHandler.connect()
        .then(() => configHandler.getIPranges())
        .then(result => {
            res.json({ ipranges: result })
        }).catch((err) => {
            console.log('Could not fetch IP ranges from database. Error', err);
        });

    // res.json(MOCKDATA);
});

app.post("/addIPranges", (req, res) => {
    // console.log(req.body.iprange);

    if (IPRangechecker(req.body.iprange)) {
        const configHandler = new ConfigHandler();

        configHandler.connect()
            .then(() => configHandler.addIPrange(req.body.iprange))
            .then(() => {
                res.json({ responseFromServer: "Succeeded to add IPrange!!", success: "success", range: req.body.iprange });
            }).catch((err) => {
                res.json({ responseFromServer: "Failure to add IPrange!!", success: "database failure", range: req.body.iprange });
            });

        // res.json({ responseFromServer: "Succeeded to add IPrange!!", success: "success", range: req.body.iprange });
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
            // If no document matched the IP range to be removed
        }).catch((err) => {
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
        await CronoScanAdd(req.body.recurring);
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
    await CronoScanRm(req.body.recurring);
    configHandler.connect()
        .then(() => configHandler.removeRecurringScan(req.body.recurring))
        .then(() => {
            res.json({ responseFromServer: "Succeeded to remove recurring scan!", success: "success", range: req.body.recurring });
            // If no document matched the IP range to be removed
        }).catch((err) => {
            res.json({ responseFromServer: "Failure to remove recurring scan due to database error.", success: "database error", recurring: req.body.recurring });
        });

});
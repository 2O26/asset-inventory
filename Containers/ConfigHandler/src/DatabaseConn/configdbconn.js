const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
var dbServer = 'configstorage:27018';
const dbName = 'configurations';

var IPRangeSchema = require('../Schemas/IPRangeSchema');
var RecurringScanSchema = require('../Schemas/RecurringScanSchema');
var OSSAPIKEYSchema = require('../Schemas/OSSAPIKEYSchema');
var DocLinkSchema = require('../Schemas/DocLinkSchema');
var TrelloKeysSchema = require('../Schemas/TrelloKeysSchema');

class ConfigHandler {
    constructor() { }

    async setDocLink(userDocLink, userAssetID) { //Create new schema where assetID and relevant DocLink is stored.
        const newDocLink_instance = new DocLinkSchema({docLink: userDocLink, assetID: userAssetID});
        try {
            await newDocLink_instance.save();
        } catch (err) {
            console.log('Error while updating Doc Link:', err.message);
        }
    }

    async getDoclink(userAssetID) { 
        const docLinkData = await DocLinkSchema.find({ assetID: userAssetID }).exec();
        const docLink = docLinkData[docLinkData.length-1].docLink; //-1 to get the most recent item
        return docLink;
    }

    async connect() {
        let connection = `mongodb://${dbServer}/${dbName}`;
        return mongoose.connect(connection)
            .then(() => {
                console.log('Connected to DB:', dbName);
            })
            .catch((err) => {
                console.error('Database connection error', dbName);
                console.error(' trying to connect to server:', connection);
                throw err;
            });
    };

    async getIPranges() {
        const ipRanges = await IPRangeSchema.find().exec();
        const transformedIpRanges = ipRanges.map(elem => elem.IPRange);
        return transformedIpRanges;
    }

    async addIPrange(IPrange) {
        const newRange_instance = new IPRangeSchema({ IPRange: IPrange });
        try {
            await newRange_instance.save();
        } catch (err) {
            console.log('Error while inserting test text:', err.message);
        }
    }

    async removeIPrange(IPrange) {
        try {
            await IPRangeSchema.findOneAndRemove({ IPRange: IPrange });
        } catch (err) {
            console.log(`Error while removing IP range:`, err.message);
        }
    }

    async getRecurringScans() {
        const recurringScans = await RecurringScanSchema.find().exec();
        return recurringScans;
    }

    async addRecurringScan(recurringScan) {
        const newRange_instance = new RecurringScanSchema({ plugin: recurringScan.plugin, time: recurringScan.time, IpRange: recurringScan.IpRange });
        try {
            await newRange_instance.save();
        } catch (err) {
            console.log('Error while inserting recurring scan data', err.message);
        }
    }

    async removeRecurringScan(recurringScan) {
        try {
            await RecurringScanSchema.findOneAndRemove({ plugin: recurringScan.plugin, time: recurringScan.time, IpRange: recurringScan.IpRange });
        } catch (err) {
            console.log(`Error while removing IP range:`, err.message);
        }
    }

    async getOSSAPIkey() {
        const apikey = await OSSAPIKEYSchema.find().exec();
        if (apikey.length !== 0) {
            return apikey[0].apikey;
        } else {
            const newSetting = { apikey: "" };
            const newOSSAPIkeyConfig = new OSSAPIKEYSchema(newSetting);
            try {
                await newOSSAPIkeyConfig.save();
            } catch (err) {
                console.log('Error while adding OSS API key:', err.message);
            }
            return "";
        }
    }

    async updateOSSAPIkey(oldapikey, updatedapikey) {
        // See if setting exists
        // if not, create settings
        // Update setting with given OSS API key
        const userSettings = await OSSAPIKEYSchema.find({ apikey: oldapikey }).exec();
        if (userSettings.length === 0) {
            const newSetting = { apikey: "" };
            const newOSSAPIkeyConfig = new OSSAPIKEYSchema(newSetting);
            try {
                await newOSSAPIkeyConfig.save();
            } catch (err) {
                console.log('Error while adding OSS API key:', err.message);
            }
        }
        try {
            const result = await OSSAPIKEYSchema.findOneAndUpdate({ apikey: updatedapikey });
        } catch (err) {
            console.log("Error updating OSS API key");
        }
    }

    async getTrelloKeys() {
        let trelloKeys;
        try {
            trelloKeys = await TrelloKeysSchema.find().exec();
        } catch (err) {
            console.log('Error while fetching Trello keys:', err.message);
            throw err;  // Rethrow or handle as needed
        }

        const defaultKeys = {
            apiKey: "",
            token: "",
            boardId: ""
        };

        if (trelloKeys.length === 0 || (trelloKeys[0] && Object.keys(trelloKeys[0]).length !== 3)) {
            try {
                const newTrelloKeysConfig = new TrelloKeysSchema(defaultKeys);
                await newTrelloKeysConfig.save();
                return defaultKeys;
            } catch (err) {
                console.log('Error while adding Trello keys:', err.message);
                throw err;  // Rethrow or handle as needed
            }
        }
        return trelloKeys[0];
    }

    async updateTrelloKeys(updatedTrelloKeys) {
        try {
            await TrelloKeysSchema.findOneAndUpdate({}, updatedTrelloKeys, { upsert: true });
        } catch (err) {
            console.log("Error updating Trello keys", err);
        }
    }
}

module.exports = ConfigHandler;
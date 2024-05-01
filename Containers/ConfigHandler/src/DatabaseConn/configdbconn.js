const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
var dbServer = 'configstorage:27018';
const dbName = 'configurations';

var IPRangeSchema = require('../Schemas/IPRangeSchema');
var RecurringScanSchema = require('../Schemas/RecurringScanSchema');
var OSSAPIKEYSchema = require('../Schemas/OSSAPIKEYSchema');
var DocLinkSchema = require('../Schemas/DocLinkSchema');

class ConfigHandler {
    constructor() { }

    async setDocLink(userDocLink, userAssetID) { //Create new schema where assetID and relevant DocLink is stored.
        console.log("###Begin configdbconn setDocLink");
        const newDocLink_instance = new DocLinkSchema({docLink: userDocLink, assetID: userAssetID});
        try {
            await newDocLink_instance.save();
        } catch (err) {
            console.log('Error while updating Doc Link:', err.message);
        }
        console.log("###End configdbconn setDocLink");
    }

    async getDoclink(userAssetID) { //Problem is here, maybe?
        console.log("###Begin configdbconn getDocLink");
        console.log(userAssetID)
        const docLinkData = await DocLinkSchema.find({ assetID: userAssetID }).exec();
        const docLink = docLinkData[docLinkData.length-1].docLink; //-1 to get the most recent item
        console.log(docLinkData)
        console.log("###End configdbconn getDocLink");
        return docLink;
        //return docLinkData.docLink;
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
}

module.exports = ConfigHandler;
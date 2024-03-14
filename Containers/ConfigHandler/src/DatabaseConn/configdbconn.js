const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
var dbServer = 'configstorage:27018';
const dbName = 'netscanConfig';

var IPRangeSchema = require('../Schemas/IPRangeSchema');


class ConfigHandler {
    constructor() { }

    async connect() {
        let connection = `mongodb://${dbServer}/${dbName}`;
        return mongoose.connect(connection)
            .then(() => {
                console.log('Connected to DB:', dbName);
            })
            .catch((err) => {
                console.error('Database connection error', dbName);
                console.error(' trying to connect to server:', connection);
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
}

module.exports = ConfigHandler;
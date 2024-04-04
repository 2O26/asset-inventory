const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
var dbServer = 'configstorage:27018';
const dbName = 'configurations';

var UserConfigSchema = require('../Schemas/UserConfigSchema');

class UserConfigHandler {
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


    async getUserSettings(userToken) {
        const userSettings = await UserConfigSchema.find({ userID: userToken }).exec();
        return userSettings;
    }

    async addUserSettings(userSetting) {
        const newSetting = { userID: userSetting.userID, leftDash: userSetting.leftDash, rightDash: userSetting.rightDash, darkmode: userSetting.darkmode };
        const newUserConfig = new UserConfigSchema(newSetting);
        console.log(newSetting);
        try {
            await newUserConfig.save();
        } catch (err) {
            console.log('Error while inserting user settings:', err.message);
        }
    }

    async updateUserSettings(sub, update) {
        // See if user exists
        // if not, create user settings
        // Update user setting given sub (keycloak uid)
        const userSettings = await UserConfigSchema.find({ userID: sub }).exec();

        if (userSettings.length === 0) {
            const newSetting = { userID: sub, leftDash: ['Graph View'], rightDash: ['Asset List'], darkmode: true };
            const newUserConfig = new UserConfigSchema(newSetting);
            try {
                await newUserConfig.save();
            } catch (err) {
                console.log('Error while adding user settings for a new user:', err.message);
            }
        }
        try {
            const result = await UserConfigSchema.findOneAndUpdate({ userID: sub }, update, { new: true, upsert: false });
        } catch (err) {
            console.log("Errror");
        }
    }
}

module.exports = UserConfigHandler;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserConfigSchema = new Schema({
    // timestamp: String,
    userID: String,
    leftDash: {
        type: Map,
        of: Number
    },
    rightDash: {
        type: Map,
        of: Number
    },
    darkmode: Boolean
});

module.exports = mongoose.model('UserConfigSchema', UserConfigSchema, 'UserConfig'); // last argument is collection to query from
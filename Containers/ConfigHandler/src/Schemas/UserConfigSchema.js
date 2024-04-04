var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserConfigSchema = new Schema({
    // timestamp: String,
    userID: String,
    leftDash: [String],
    rightDash: [String],
    darkmode: Boolean
});

module.exports = mongoose.model('UserConfigSchema', UserConfigSchema, 'UserConfig'); // last argument is collection to query from
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RecurringScanSchema = new Schema({
    // timestamp: String,
    plugin: String,
    time: String,
    IpRange: String
});

module.exports = mongoose.model('RecurringScanSchema', RecurringScanSchema, 'RecurringScans'); // last argument is collection to query from
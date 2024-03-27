var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IPRangeSchema = new Schema({
    IPRange: String
});

module.exports = mongoose.model('IPRangeSchema', IPRangeSchema, 'IPranges'); // last argument is collection to query from
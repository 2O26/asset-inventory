var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OSSAPIKEYSchema = new Schema({
    apikey: String
});

module.exports = mongoose.model('OSSAPIKEYSchema', OSSAPIKEYSchema, 'OSSAPIKEY'); // last argument is collection to query from
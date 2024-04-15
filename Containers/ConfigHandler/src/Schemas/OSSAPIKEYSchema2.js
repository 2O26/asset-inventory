var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OSSAPIKEYSchema2 = new Schema({
    apikey: String
});

module.exports = mongoose.model('OSSAPIKEYSchema2', OSSAPIKEYSchema2, 'OSSAPIKEY2'); // last argument is collection to query from
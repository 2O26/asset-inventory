var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DocLinkSchema = new Schema({ //This saves the docLink for a given assetID.
    docLink: String,
    assetID: String
});

module.exports = mongoose.model('DocLinkSchema', DocLinkSchema, 'DocLink'); // last argument is collection to query from
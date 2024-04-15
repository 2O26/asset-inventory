var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LibrarySchema = new Schema({
    purl: String,
    assetids: [String],
    name: String,
    version: String,
    CVE: {
        id: String,
        displayName: String,
        title: String,
        description: String,
        cvssScore: Number,
        cvssVector: String,
        cwe: String,
        cve: String,
        reference: String,
        externalReference: [Array]
    }
});

module.exports = mongoose.model('LibrarySchema', LibrarySchema, 'Library'); // last argument is collection to query from
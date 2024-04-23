var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrelloKeysSchema = new Schema({
  apiKey: String,
  token: String,
  boardId: String
});

module.exports = mongoose.model('TrelloKeysSchema', TrelloKeysSchema, 'TrelloKeys');
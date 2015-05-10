var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/doppler');

var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var Album = new Schema({
	"albumArtist": {type: String},
	"albumTitle": {type: String},
	"albumYear": {type: Number},
	"albumGenre": {type: String},
	"albumArt": {type: String},
	"songs": 
});
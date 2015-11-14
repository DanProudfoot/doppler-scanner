var fs = require('fs');
var mm = require('musicmetadata');
var walk = require('walkdir');
var path = require('path');
var mongoose = require('mongoose');
var colors = require('colors');

mongoose.connect('mongodb://localhost/Doppler');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var albumSchema = mongoose.Schema({
	albumArtist: [String],
	album: String,
	year: String,
	genre: Array,
	artPath: String
});

var Album = mongoose.model('Album', albumSchema, 'Albums');
var musicPath = process.argv[2] || '../music';
var emitter = walk(musicPath);

emitter.on('file',function(filename,stat){
	if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
		mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
			if (err) throw err;
			delete metadata.picture;
			metadata.path = path.relative(musicPath, filename);
			metadata.cover = path.dirname(metadata.path) + "/cover.jpg";

			var newAlbum = new Album({
				album: metadata.album,
				albumArtist: metadata.albumartist,
				year: metadata.year.slice(0,4),
				genre: metadata.genre,
				artPath: metadata.cover
			});

			var upsertData = newAlbum.toObject();
			delete upsertData._id;

			Album.update({album: metadata.album}, upsertData, {upsert: true}, function(err, rawResponse) {
				if (err) console.log(err);
				
				if (rawResponse.upserted) {
					console.log("Added Album: ".green + rawResponse.upserted[0]._id);
				} else {
					console.log("Skipping: ".red + metadata.album);
				}
			})
		});
	};
});
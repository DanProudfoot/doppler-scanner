var fs = require('fs');
var mm = require('musicmetadata');
var walk = require('walkdir');
var path = require('path');
var mongoose = require('mongoose');
var colors = require('colors');

mongoose.connect('mongodb://localhost/Doppler');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var songSchema = mongoose.Schema({
	songTitle: String,
	songArtist: Array,
	albumArtist: Array,
	album: String,
	year: String,
	track: Object,
	disk: Object,
	genre: Array,
	path: String,
	artPath: String
})

var Song = mongoose.model('Song', songSchema, 'Songs');	
var musicPath = process.argv[2] || '../music';
var emitter = walk(musicPath);

emitter.on('file',function(filename, stat){
	if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {

		mm(fs.createReadStream(filename), function (err, metadata) {
			if (err) throw err;
			delete metadata.picture;
			metadata.path = path.relative(musicPath,filename);
			metadata.cover = path.dirname(metadata.path) + "/cover.jpg";

			var newSong = new Song({
				songTitle: metadata.title,
				songArtist: metadata.artist,
				albumArtist: metadata.albumartist,
				album: metadata.album,
				year: metadata.year.slice(0,4),
				track: metadata.track,
				disk: metadata.disk,
				genre: metadata.genre,
				path: metadata.path,
				artPath: metadata.cover
			});

			var upsertData = newSong.toObject();
			delete upsertData._id;

			Song.update({SongTitle: metadata.title}, upsertData, {upsert: true}, function(err, rawResponse) {
				if (err) console.log(err);
				if (rawResponse.upserted) {
					console.log("Added Song: ".green + metadata.title);
				} else {
					console.log("Skipping: " + metadata.title);
				}
			})
		});
	};
});
emitter.on('error', function(path, error) {
	console.log(error);
	process.exit(1);
});


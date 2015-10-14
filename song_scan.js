var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
mongoose = require('mongoose');
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

			Song.findOne({songTitle: metadata.title}, function(err, docs){
				if (err){
					console.log("Mongo error: " + err)
					return false;
				}
				if (!docs){
					console.log("Saved song:".green + metadata.title);
					newSong.save();
				} else {
					console.log("Song exists: ".red + metadata.title);
				}
			});
		});
	};
});
emitter.on('error', function(path, error) {
	console.log(error);
	process.exit(1);
});


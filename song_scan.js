var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
util = require('util'),
mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/Doppler');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function (callback) {

	var songSchema = mongoose.Schema({
		songTitle: String,
		songArtist: [String],
		albumArtist: [String],
		album: String,
		year: String,
		track: Number,
		genre: Array,
		duration: Number,
		path: String,
		artPath: String
	})

	var Song = mongoose.model('Song', songSchema, 'Songs');	
	
	var musicPath = "../music/";

	var emitter = walk(musicPath),
	albumCheck = [];

	emitter.on('file',function(filename,stat){
		if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
			var parser = mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
				if (err) throw err;
				delete metadata.picture;
				metadata.path = path.relative('/home/',filename);
				metadata.year = metadata.year.slice(0,4);
				metadata.cover = path.dirname(metadata.path) + "/cover.jpg";
				metadata.track = metadata.track.no;

				var newSong = new Song({
					songTitle: metadata.title,
					songArtist: metadata.artist,
					albumArtist: metadata.albumartist,
					album: metadata.album,
					year: metadata.year,
					track: metadata.track,
					genre: metadata.genre,
					duration: metadata.duration,
					path: metadata.path,
					artPath: metadata.cover
				});

				Song.findOne({songTitle: metadata.title}, function(err, docs){
					if (err){
						console.log("Mongo error: " + err)
						return false;
					}
					if (!docs){
						console.log("++++ Saved song:" + metadata.title);
						newSong.save();
					} else {
						console.log("Song exists: " + metadata.title);
					}
				});
				
			});
		};
	});


});


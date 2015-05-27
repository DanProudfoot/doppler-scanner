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
	var albumSchema = mongoose.Schema({
		albumArtist: [String],
		album: String,
		year: String,
		genre: Array,
		artPath: String
	});

	var songSchema = mongoose.Schema({
		songTitle: String,
		songArtist: [String],
		albumArtist: [String],
		album: String,
		year: String,
		track: {no:Number, of:Number},
		genre: Array,
		duration: Number,
		path: String,
		artPath: String
	})

	var Album = mongoose.model('Album', albumSchema, 'Albums');
	var Song = mongoose.model('Song', songSchema, 'Songs');	
	
	var musicPath = "./music/The Flaming Lips";

	var emitter = walk(musicPath),
	albumCheck = [];

	emitter.on('file',function(filename,stat){
		if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
			var parser = mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
				if (err) throw err;
				delete metadata.picture;
				metadata.path = path.normalize(filename);
				metadata.cover = path.dirname(filename) + "/cover.jpg";

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

				newSong.save();
				console.log(metadata.title);
				
				var newAlbum = new Album({
					album: metadata.album,
					albumArtist: metadata.albumartist,
					year: metadata.year,
					genre: metadata.genre,
					artPath: metadata.cover
				});

				albumSchema.pre('save',function(next){
					var self = this;
					Album.find({album:metadata.album}, function(err, docs){
						if (!docs.length){
							newAlbum.save();
							console.log("============= Saved album: " + metadata.album);
							next();
						} else {
							console.log("Album Exists: " + metadata.album);
							next();
						}
					})
				})
			});
		};
	});


});


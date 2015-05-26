var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
jf = require('jsonfile'),
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
	
	var musicPath = "music/";

	var emitter = walk(musicPath),
	songList = [];

	emitter.on('file',function(filename,stat){
		if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
			var parser = mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
				if (err) throw err;
				delete metadata.picture;
				metadata.path = path.normalize(filename);
				var parsed = path.parse(filename);
				metadata.cover = parsed.dir + "/cover.jpg";
				songList.push(metadata);
			});
		};
	});

	emitter.on('end', function(){
		console.log("Scan ended, naively waiting 5 secs");

		setTimeout(function(){
			console.log("Here's some stuff");
			var albumCheck = [];

			songList.forEach(function(value, index, array){

				var newSong = new Song({
					songTitle: value.title,
					songArtist: value.artist,
					albumArtist: value.albumartist,
					album: value.album,
					year: value.year,
					track: value.track,
					genre: value.genre,
					duration: value.duration,
					path: value.path,
					artPath: value.cover
				});

				if (albumCheck.indexOf(value.album) < 0) {
					
					albumCheck.push(value.album);

					var newAlbum = new Album({
						album: value.album,
						albumArtist: value.albumartist,
						year: value.year,
						genre: value.genre,
						artPath: value.cover
					});

					newAlbum.save();
					
				};

				newSong.save();

				console.log(newAlbum);
			})

		}, 5000)

	});
});


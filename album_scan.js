var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
mongoose = require('mongoose'),
async = require('async');
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
var emitter = walk(musicPath),
albumAr = [];

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

			albumAr.push(newAlbum);	
		});
	};
});

emitter.on('end', function(){
	setTimeout(function(){
		console.log(albumAr.length);
		async.eachSeries(albumAr, function(element, callback){
			
			Album.findOne({album: element.album}, function(err, docs){

				if (err){
					console.log("Mongo error: " + err);
					return false;
				}
				if (!docs){
					console.log("Saved album: ".green + element.album);
					element.save(function(err){
						if (err) console.log(err);
						callback();
					});
				} else {
					console.log("Album Exists: ".red + element.album);
					callback();
				}
			});
		});
	}, 2000)
});

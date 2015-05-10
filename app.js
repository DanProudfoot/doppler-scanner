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
	var uploadSchema = mongoose.Schema({
		albumArtist: String,
		albumTitle: String,
		albumYear: Number,
		albumGenre: String,
		albumArt: String,
		songs: Array
	});


	var Album = mongoose.model('Album', uploadSchema, 'Albums');
		
	var albumArtist = "Steven Wilson",
		albumTitle = "Hand Cannot Erase",
		albumYear = 2015,
		albumGenre = "Prog Rock";
		
	var musicPath = "music/" + albumArtist + "/" + albumTitle;
	var albumArt = musicPath + "/art.png";

	var emitter = walk(musicPath),
	metadata = {},
	songList = [];

	emitter.on('file',function(filename,stat){
		//console.log(filename);
		if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
			var parser = mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
				if (err) throw err;
				delete metadata.picture;
				metadata.path = filename;
				songList.push(metadata);


			});
		};
	});

	emitter.on('end', function(){

		setTimeout(function(){
			console.log("ended");

			var newAlbum = new Album({
				albumArtist: albumArtist,
				albumTitle: albumTitle,
				albumYear: albumYear,
				albumGenre: albumGenre,
				albumArt: albumArt,
				songs: songList
			});

			newAlbum.save();

			console.log(newAlbum.songs)

			//process.exit(0);

		}, 2000)

	});
});


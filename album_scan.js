var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
util = require('util'),
mongoose = require('mongoose'),
async = require('async');


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

	var Album = mongoose.model('Album', albumSchema, 'Albums');
	
	var musicPath = "../music/";

	var emitter = walk(musicPath),
	albumAr = [];

	emitter.on('file',function(filename,stat){
		if (path.extname(filename) == '.m4a' || path.extname(filename) == '.mp4' ) {
			var parser = mm(fs.createReadStream(filename),{duration: true}, function (err, metadata) {
				if (err) throw err;
				delete metadata.picture;
				metadata.path = path.relative('/home/',filename);
				metadata.year = metadata.year.slice(0,4);
				metadata.cover = path.dirname(metadata.path) + "/cover.jpg";

				var newAlbum = new Album({
					album: metadata.album,
					albumArtist: metadata.albumartist,
					year: metadata.year,
					genre: metadata.genre,
					artPath: metadata.cover
				});

				albumAr.push(newAlbum);
				
			});
		};
	});

	emitter.on('end', function(){

		
		console.log("scan ended");

		setTimeout(function(){
			
			console.log(albumAr.length);
			
			// albumAr.forEach(function(element, index, array){
				async.eachSeries(albumAr, function(element, callback){
					
					Album.findOne({album: element.album}, function(err, docs){

						if (err){
							console.log("Mongo error: " + err);
							return false;
						}
						if (!docs){
							console.log("============= Saved album: " + element.album);
							element.save(function(err){
								if (err) console.log(err);
								callback();
							});
						} else {
							console.log("Album Exists: " + element.album);
							callback();
						}

					});

				}, function(args){
					// body
				})

			// });
		}, 2000)
	})	


	


});


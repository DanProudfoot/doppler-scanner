var fs = require('fs'),
mm = require('musicmetadata'),
walk = require('walkdir'),
path = require('path'),
jf = require('jsonfile'),
util = require('util');


var file = "output.json";
	
var albumArtist = "Steven Wilson",
	albumTitle = "Hand Cannot Erase",
	albumYear = 2015,
	albumGenre = "Prog Rock";
	
var musicPath = "music/" + albumArtist + "/" + albumTitle;
var albumArt = musicPath + "/art.png";

var emitter = walk(musicPath),
metadata = {},
songList = [];

// do - on update to albums, run this, throw metadata at database
emitter.on('file',function(filename,stat){
	//console.log(filename);
	if (path.extname(filename) == '.m4a' ) {
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

		var albumDetails = {albumArtist: albumArtist, albumTitle: albumTitle, albumYear: albumYear, albumGenre: albumGenre, albumArt: albumArt, songs: songList} 

		jf.writeFile(file, albumDetails, function(err) {
			console.log(err)
		});
	}, 2000)

});
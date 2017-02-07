"use strict";

/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
 */
var http = require('http');
var url = require('url');
var fs = require('fs');
var port = 3027;

var config = JSON.parse(fs.readFileSync('config.json'));


var imageNames = ['ace.jpg', 'bubble.jpg', 'chess.jpg', 'fern.jpg', 'mobile.jpg'];
var stylesheet = fs.readFileSync('gallery.css');

function getImageNames(callback) {
	fs.readdir('images', function(err, fileNames) {		/*path (string), callback (function)*/
		if (err) {
		callback(err, undefined);
		}
		else {
			callback(false, fileNames);
		}
	});
}

function imageNamesToTags(fileNames) {
	return fileNames.map(function(fileName) {
		return `<img src="${fileName}" alt="${fileName}">`;
	});
}

function buildGallery(imageTags) {
	var html = '<!doctype html>';
			html += '<head>';
			html += 	'<title>' + config.title + '</title>';
			html += 	'<link href="gallery.css" rel="stylesheet" type="text/css"';
			html += '</head>';
			html += '<body>';
			html += 	'<h1>Gallery</h1>';
			html += 	'<form>';
			html += 		'<input type="text" name="title">';
			html += 		'<input type="submit" value="Change Gallery Title">';
			html += 	'</form>';
			html += imageNamesToTags(imageTags).join('');
			html += '<form action="" method="POST" enctype="multipart/form-data">';
			html += 	'<input type="file" name="image">';
			html +=		'<input type="submit" value="Upload Image">';
			html += '</form>';
			html += '</body>';
	return html;
}
/*
var gHtml = imageNames.map(function(fileName) {
	return '<img src="' + fileName + '"alt="a fishing ace at work">';
}).join('');
*/

function uploadImage(req, res) {
	var body='';
	req.on('error', function() {
		res.statusCode = 500;
		res.end();
	});
	req.on('data', function(data) {
		body += data;
	});
	req.on('end', function() {
		fs.writeFile('filename', data, function(err) {
			if(err) {
				console.error(err);
				res.statusCode = 500;
				res.end();
				return;
			}
			serveGallery(req, res);
		});
	});
}

function serveGallery(req, res) {
	getImageNames(function(err, imageNames) {
		if (err){
			console.error(err);
			res.statusCode = 500;
			res.statusMessage = 'Server error';
			res.end();
			return;
		}
		else {
			res.setHeader('Content-Type', 'text/html');
			res.end(buildGallery(imageNames));
		}
	});
}

function serveImage(filename, req, res) {
	fs.readFile('images/' + filename, function(err,body) {
		if (err) {
			console.error(err);
			res.statusCode = 500;
			res.statusMessage = "Server error!";
			res.end("Silly me");
			return;
		}
		res.setHeader("Content-Type", "image/jpeg");
		res.end(body);
	});
}

var server = http.createServer(function(req, res){

	var urlParts url.parse(req.url)

	if(urlParts.query) {
		var matches = /title=(.+)($|&)/.exec(urlParts.query);
		if(matches && matches[1]) {
			config.title = decodeURIComponent(matches[1]);
			fs.writeFile('config.json', JSON.stringify(config));
		}
	}

	switch (urlParts.pathname) {
		case '/':
		case '/gallery':
			if(req.method == 'GET') {
				serveGallery(req, res);
			} else if(req.method == 'POST') {
				uploadImage(req, res);
			}
			break;
		case '/gallery.css':
			res.setHeader('Content-Type', 'text/css');
			res.end(stylesheet);
			break;
		default:
			serveImage(req.url, req, res);
			break;
	}
});

server.listen(port, function(){
	console.log("Listening on Port " + port);
});

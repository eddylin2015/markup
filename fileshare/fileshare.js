'use strict'


const 	https = require('http');
const 	util = require('util');
const 	fs = require("fs");
const 	url = require('url');
const 	staticfile = require('./StaticFile');
const 	querystring = require('querystring');
const  Multer  = require('multer');
const mrs_docx_dir="d:/code/fileshare/tmp/";
var storage = Multer.diskStorage({
    destination: mrs_docx_dir,
    filename: function (req, file, cb) {
        var fileFormat = (file.originalname).split(".");
        cb(null, file.originalname);
    }
});
const multer = Multer({
    storage: storage,  //limits: {fileSize: 15 * 1024 * 1024   }// no larger than 15mb
});

const hostdir = "www/";  //www
const port=81;
var server =null;
console.log("Express component!");
var express = require('express');
var app = express();
app.disable('x-powered-by');
app.post('/upload',
    multer.array('upload',16),         
    function (req, res) {
        if (!req.files) {
            console.log("No file received");
            return res.send({
              success: false
            });
          } else {
            console.log('file received');
            return res.send({
              success: true
            })
          }
    });
app.use( function (req, res) {	WebRouter(req, res);});
server = https.createServer(app);

server.listen(port, function () {
	console.log("server running at https://IP_ADDRESS:",port)
});




function WebRouter(req, res) {
	
	let q = url.parse(req.url, true);
	let filename = "." + q.pathname;
	filename = filename.replace("./", "");
	console.log("url_file_name:" + filename);
	let mimetype = "text/html";
	mimetype = staticfile.mimetype(filename);
	if (mimetype != 'NULL') {
		filename = filename.replace("..", "");
		filename = filename.replace(":", "");
		filename = filename.replace("//", "/");
		staticfile._out(fs, hostdir + filename, mimetype, res);
		return;
	}
	console.log(req.headers);
	console.log(req.connection.remoteAddress);
	if (req.url.startsWith('/mbc')) {
		mimetype = "text/html";
		staticfile._pipe(fs, hostdir + 'index_mbc.htm', mimetype, res);
		return;
	}
    var dir="tmp/";
	//var dir = 'F:/report_doc/outd/xml/';
	
//	var coolauth = require('./coolauth');
//var auth_username = coolauth.auth(req, res);
//	if (auth_username == null) return;
  
	var auth_username ="abc";
	
	if (req.url.startsWith('/down')) {
		staticfile.downfile(dir, req, res);
		return;
	}
	if (req.url.startsWith('/uploadphp')) {
		try{
		    staticfile.uploadphp(dir, auth_username, req, res);
		}catch(E){
			console.log(E);
		}
		return;
	}
	if (req.url.startsWith('/upload') && req.method.toLowerCase() == 'post')
		{
		   console.log("upload");
		   try{
			  var form = new formidable.IncomingForm();
			  staticfile.uploadfile(dir, form, req, res);
		   }catch(E){
			  console.log(E);
		   }
		   return;
	   }
	/*if (req.url.startsWith('/index.php')) {
		mimetype = "text/html";
		staticfile._pipe(fs, hostdir + 'index_mbc.html', mimetype, res);
		return;
	}*/
	res.writeHead(301, { Location: '/uploadphp' });
	res.end();
}
//////////////////////////////////////////////////////////////////////////
var os = require('os');
var ifaces = os.networkInterfaces();

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ++alias;
  });
});

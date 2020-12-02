"use strict";
var fs = require('fs');
var url = require('url');
var util = require('util');
var http = require('http');
var Static_File = (function () {
    function Static_File() {
    }

    Static_File._out = function (fs, filename, mimetype, res, jsonObject) {
        console.log('read static file' + filename);
        try {
            if (fs.existsSync(filename)) {
                fs.readFile(filename, function (err, data) {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        return res.end("404 Not Found");
                    }

                    res.writeHead(200, { 'Content-Type': mimetype });
                    let sdata = data.toString()
                    for (var prop in jsonObject) {
                        console.log("Key:" + prop);
                        console.log("Value:" + jsonObject[prop]);
                        let myre = new RegExp(prop, "g");
                        sdata = sdata.toString().replace(myre, jsonObject[prop]);
                    }
                    res.write(sdata);
                    res.end();
			console.log('end ' + filename);
                    return;
                });
            }
            else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end("404 Not Found");
            }
        }
        catch (err) {
            console.log(err);
        }
    };
    Static_File._pipe = function (fs, filename, mimetype, res) {
        console.log('read static file_pipe:' + filename);
        try {
            if (fs.existsSync(filename)) {
                res.writeHead(200, { 'Content-Type': mimetype }); //,"Content-Disposition":"attachment;filename=""});
                fs.createReadStream(filename).pipe(res);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end("404 Not Found");
            }
        }
        catch (err) {
            console.log(err);
        }
    };
    Static_File.mimetype = function (filename) {
        var dotoffset = filename.lastIndexOf('.');
        if (dotoffset == -1)
            return "NULL";
        var extra_name = filename.substr(dotoffset);
        var mimetype_obj = {
            '.html': 'text/html',
            '.ico': 'image/x-icon',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.txt': 'text/plain'
        };
        for (var x in mimetype_obj) {
            if (extra_name == x)
                return mimetype_obj[x];
        }
        return "NULL";
    };
    Static_File.downfile = function (dir, req, res) {
        var query = url.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            //read the image using fs and send the image content back in the response
            fs.readFile(dir + query.file, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' });
                    console.log(err);
                    res.end("No such file");
                }
                else {
                    //specify Content will be an attachment
                    res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(query.file));
                    res.end(content);
                }
            });
        }
        return;
    };
    Static_File.uploadfile = function (dir, form, req, res) {
        form.multiples = true;
        form.uploadDir = "mytemp";
		
        form.parse(req, function (err, fields, files) {
			console.log(fields);
			console.log(files);
            if (fields.logout == "logout") {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
                res.end('<html><body>Need some creds!<a href=/>login again</a> </body></html>');
                return;
            }
            console.log(util.inspect({ fields: fields, files: files }));
            var filelist = [];
            if (Array.isArray(files.upload)) {
                files.upload.forEach(function (file) { filelist.push(file); });
            }
            else {
                filelist.push(files.upload);
            }
            //res.writeHead(200, {'content-type': 'text/plain'});
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff'
            });
            var file_cnt = filelist.length;
            var received_cnt = 0;			
            var erro_cnt = 0;
			console.log(filelist);
            filelist.forEach(function (file) {
                if(file != undefined ) {				console.log(file.path);
				
                fs.exists(file.path, function (exists) {
                    try {
                        res.write(file.name + "\n");
                        res.flush();
                        if (exists)
                            fs.renameSync(file.path, dir + fields.title + "/" + file.name);
                        console.log(exists ? "no." + (received_cnt++) + " / " + file_cnt + 'file' + file.name + ' sync it!' : file.name + 'no file!');
                    }
                    catch (err) {
                        // Handle the error here.
                        res.write("error:" + file.name);
                        console.log(erro_cnt++);
                        console.log(err);
                    }
                    if (erro_cnt + received_cnt == file_cnt)
                        res.end();
                });
				}
            });
        });
        return;
    };
    Static_File.uploadphp = function (dir, auth_username, req, res) {
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        res.write('<form action=/ method="post"><h3>file share:' + auth_username +
            '<input type=hidden name="logout" value=logout>' +
            '<input type=hidden name=oldauthusr value="' + auth_username + '">' +
            '<input type=submit value="logout"></form></h3>' +
            '<form action="/upload" enctype="multipart/form-data" method="post">' +
            '<input type="text" name="title"><br>' +
            '<input type="file" name="upload" multiple="multiple"><br>' +
            '<input type="submit" value="Upload">' +
            '</form>');
        var files = fs.readdirSync(dir);
        files.forEach(function (file) {
            if (fs.statSync(dir + file).isDirectory()) {
                // filelist = walkSync(dir + file + '/', filelist);
            }
            else {
                //filelist.push(file);
                res.write("<a href=/down?file=" + encodeURI(file) + ">" + file + "</a><br>");
            }
        });
        res.end();
        return;
    };
    Static_File.decode = function (str) {
        let temp = str.replace('sesh=', '');
        console.log(temp);
        let temp1 = temp.substring(8, temp.length - 40);
        console.log(temp1);
        let temp2 = new Buffer(temp1, 'hex').toString('utf8');
        console.log(temp2);
        return temp2;
    };
    Static_File.encode = function (str) {
        return "a470a388" + (new Buffer(str).toString('hex')) + "ea39244a036b2358d34ac48d4747d947d861222b";
    };
    ////////////////
    Static_File.api_host = '192.168.101.250';
    //Static_File.api_host='192.168.102.17';
    Static_File.postdata_str = function (postData, suburl, response) {
        var options = {
            hostname: Static_File.api_host, port: 8081,
            path: suburl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        var req = http.request(options, function (res) {
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                var _body = Buffer.concat(body).toString();
                console.log(_body);
                return _body;
            });
        });
        req.on('error', function (e) {
            console.error("problem with request: " + e.message);
        });
        req.write(postData);
        req.end();
    };
    ////////////////
    Static_File.postdata = function (postData, suburl, response) {
        var options = {
            hostname: Static_File.api_host,
            port: 8081,
            path: suburl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        var req = http.request(options, function (res) {
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                var _body = Buffer.concat(body).toString();
                console.log(_body);
                response.end(_body);
            });
        });
        req.on('error', function (e) {
            console.error("problem with request: " + e.message);
        });
        req.write(postData);
        req.end();
    };
    return Static_File;
}());
module.exports = Static_File;
/*
var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + file).isDirectory()) {
      filelist = walkSync(dir + file + '/', filelist);
    }
    else {
      filelist.push(file);
    }
  });
  return filelist;
};
/////////////////
    if (req.url.startsWith('/.well-known/acme-challenge/pWWkRfZfiHxiH-oHMWe7HbH9iGb5HdaMcU331opa2z0'))
    {
        staticfile._pipe('pWWkRfZfiHxiH-oHMWe7HbH9iGb5HdaMcU331opa2z0',mimetype,res);
        return;
    }
    */

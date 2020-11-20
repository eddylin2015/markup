'use strict';
const zlib = require('zlib');
const express = require('express');
const images = require('./images');
const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const pug = require('pug');
const netutils = require('../../lib/net_utils');
const grp=require('../../db/it_support_right');
function getModel() { return require(`./model-mysql-pool`); }
const router = express.Router();
var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

router.get('/:book', (req, res, next) => {
    let studref=req.params.book.toUpperCase();
    let filePath="c:/photo"+studref.substring(0,4)+"/qrcode/"+studref.replace("R","");
    
    if(fs.existsSync(filePath))
    {
        res.set('Content-Type', mime.jpg);
        fs.createReadStream(filePath).pipe(res);
    }else{
        res.set('Content-Type', mime.txt);
        res.end("");
    }
  
});


//
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;
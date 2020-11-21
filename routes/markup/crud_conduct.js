// markup

'use strict';
const config = require('../../config');

const PHP_HOST= config.get('PHP_HOST');
const PHP_PORT= config.get('PHP_PORT');
const express = require('express');
const images = require('./images');
const http = require('http');
const querystring = require('querystring');
const grp= require('../../db/it_support_right');
var redis = require("redis"),
    client = redis.createClient();
const netutils = require('../../lib/net_utils');
function getModel() { return require(`./model-mysql-pool_conduct`); }
const router = express.Router();
// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
// Set Content-Type for all responses for these routes
/**
 * GET /markup/add
 * Display a page of books (up to ten at a time).
 */

function CheckCLASSNO(req,classno)
{
    let right = false;
    if (req.user && req.user.marksys_info) {
        if (req.user.marksys_info[1][0].RoleID == 1
            || req.user.marksys_info[1][0].RoleID == 8
            || req.user.marksys_info[1][0].RoleID == 9
        ) {
            return true;
        }
        else {
            return req.user.marksys_info[1][0].classno==classno;
        }
    }
    return right;
}
function GetAOT(req){
    let aot=10;
    if (req.user && req.user.marksys_info) {
        if (req.query.fn.startsWith("I")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
    }
    return aot;  
}
function GetAOTWith(fn,req){
    let aot=10;
    if (req.user && req.user.marksys_info) {
        if (fn.startsWith("I")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
    }
    return aot;  
}

function GetSAOT(req){    
    return (req.user && req.user.marksys_info)? req.user.marksys_info[0][0].allowOpSect:10;
}
function GetPAOT(req){
    return (req.user && req.user.marksys_info)? req.user.marksys_info[0][0].p_allowOpSect:10;
}
function GetMyClass(req){
    return (req.user && req.user.marksys_info)? req.user.marksys_info[1][0].classno:null;
}
function GetSID(req){
    return (req.user && req.user.marksys_info)? req.user.marksys_info[0][0].session_id:null;
}
function showMarksysInfo(req, res) {
    let esess=req.user.marksys_info[0][0];
    let euser=req.user.marksys_info[1][0];
    let ecourse=req.user.marksys_info[2];
    let classcourse=req.user.marksys_info[3];
    res.render('markup/index.pug', {
        profile: req.user,
        esess: esess,
        euser: euser,
        ecourse: ecourse,
        eclasscourse: classcourse,
        markadmin: grp.GRP_R_MARK_ADMIN(req.user),
        pstafpanel :grp.GRP_R_Pri_OA(req.user),
        sstafpanel :grp.GRP_R_Sec_OA(req.user),
    });
}

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

function HttpPostMKWrgTotal(param_host, param_path, param_postData, respone) {
    let options = {
        hostname: param_host, port: 8082,
        path: param_path, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => { 
            respone.writeHead(200, {
                //'Content-Type': 'application/json',
                'Content-Type': 'text/html; charset=utf-8',
                'X-Powered-By': 'bacon'
              });
            respone.write("<table id=tbname border=1><tr>");
            respone.write("<td rowspan=2>編號<td rowspan=2>班<td rowspan=2>座<td rowspan=2>姓__名<td rowspan=2>錯誤<td rowspan=2>義工");
            respone.write("<td colspan=8>第一段<td colspan=8>第二段<td colspan=8>第三段");
            respone.write("<tr><td>遲到<td>缺席<td>曠次<td>曠節<td>違紀<td>褒獎<td>操行<td>參考<td>遲到<td>缺席<td>曠次<td>曠節<td>違紀<td>褒獎<td>操行<td>參考<td>遲到<td>缺席<td>曠次<td>曠節<td>違紀<td>褒獎<td>操行<td>參考");
            respone.end(rawData); }
        );
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    req.write(param_postData);
    req.end();
}

//CONDUCT
router.get('/conduct/:book', (req, res, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let classno=req.params.book;
    let staf_ref = netutils.id2staf(req.user);
    let aot = 10;
    if (req.user)
        if (req.user.marksys_info) {
            if (classno.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
            if (classno.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
        }    
    getModel().readconduct(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudConduct.pug', {
            profile: req.user,
            classno:req.params.book,
            fn: req.params.book + "操行",
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            esess: req.user.marksys_info[0][0],
            aot:aot,
            OpSect: GetAOTWith( req.params.book,req),
        });
    });
});
/*
router.get('/studcourse/editpingyu/:book', (req, Response, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let staf_ref = netutils.id2staf(req.user);      
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let cdid = req.params.book;
    let aot = 10;
    let lno=req.query.lno;
    if (req.user&&req.user.marksys_info) {
        if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
    }
    getModel().readpingyu(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/editStudPingyu.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: cdid,
            books: entity,
            editable: req.query.r,
            aot:aot
        });
    });
});
*/
router.get('/studcourse/editcondu/:book', (req, Response, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let cdid = req.params.book;
    let aot = 10;
    if (req.user)
        if (req.user.marksys_info) {
            if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
            if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
        }
    let parm = {
        aot: aot,
        cno: cdid,
        cdid: cdid,
        course: req.query.fn,
        returl: req.baseUrl + `/conduct/${cdid}?r=true`,
        fn: req.query.fn
    };
    //Response.setHeader('Content-Type', 'text/html');
    //netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/condu_grid.php?` + querystring.stringify(parm), Response);
    getModel().readconduct(null, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/editStudConduct.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: cdid,
            books: entity,
            editable: req.query.r,
            aot:aot
        });
    });

});

router.get('/studcourse/editcondu.php/:book', (req, Response, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let cdid = req.params.book;
    let aot = 10;
    if (req.user)
        if (req.user.marksys_info) {
            if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
            if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
        }
    let parm = {
        aot: aot,
        cno: cdid,
        cdid: cdid,
        course: req.query.fn,
        returl: req.baseUrl + `/conduct/${cdid}?r=true`,
        fn: req.query.fn
    };
    Response.setHeader('Content-Type', 'text/html');
    netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/condu_grid.php?` + querystring.stringify(parm), Response);
});
router.post('/studcourse/editcondu/condusave', images.multer.single('image'), (req, Response, next) => {
    let staf = "null";
    let stafref = "null";
    let aot = 10;
    if (req.user) {
        staf = req.user.id;
        stafref = netutils.id2staf(req.user);
        if (req.user.marksys_info) {
            if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
            if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
        }
    }
    let myclass = GetMyClass(req);
    getModel().UpdateConduct(aot,myclass,JSON.parse( req.body.datajson ), (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( `更新 ${entity} 筆. 完成! `);
    });
});

router.post('/studcourse/editcondu/condusavejson', images.multer.single('image'), (req, Response, next) => {    
    let staf = "null";
    let myclass = GetMyClass(req);
    if (req.user) staf = req.user.id;
    let aot =  req.query.aot;    
    getModel().UpdateConductArr(aot,myclass,req.body.data, (err, entity) => {
        if (err) { next(err); return; }        
        Response.write( "Update  Records:" );        
        Response.end( entity.toString());
    });
});

router.get('/studcourse/regcondu/:book', (req, Response, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let cdid = req.params.book;
    let ccno = "";
    let rurl = encodeURI(req.baseUrl) + `/conduct/${cdid}?r=true&fn=` + encodeURI(req.query.fn);
    let parm = { cno: cdid, stafref: "", course: req.query.fn, returl: rurl };
    if (req.user && req.user.marksys_info) parm.stafref = netutils.id2staf(req.user);
    netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/condu_grid_stud.php?` + querystring.stringify(parm), Response);
});
router.post('/studcourse/regcondu/condu_jsontwolist.php', (req, Response, next) => {
    req.body.stafref = netutils.id2staf(req.user);
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/condu_jsontwolist.php', "rawData=" + JSON.stringify(req.body), Response);
});

function ExpArrayToXls(arraydata_str, exportfilename ,respone) {
    let  param_postData = arraydata_str;
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/api/NpoiXls/ExpArrayToXls' , method: 'POST',
        headers: { 'Content-Type': 'application/json','Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        respone.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(exportfilename) + ";");
        res.on('data', (chunk) => { respone.write( chunk); }); res.on('end', () => { respone.end(); });
    });
    req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    req.write(param_postData); req.end();
}

/**
 * Errors on "/books/*" routes.
 */
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;
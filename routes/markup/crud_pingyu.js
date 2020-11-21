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
function getModel() { return require(`./model-mysql-pool_pingyu`); }
const router = express.Router();
// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
// Set Content-Type for all responses for these routes
/**
 * GET /markup/add
 * Display a page of books (up to ten at a time).
 */
function CheckAdmin(req){
    if(req.user.id==2002024) return true;
    return false;
}
function CheckOfficeStaff(req){
    if(req.user.id==2002024) return true;
    return false;
}
function CheckCLASSCDID(req,cdid)
{    
    if(!req.user.marksys_info[3]) return false;
    let right=false;
    for (let i = 0; i < req.user.marksys_info[3].length; i++) {
        if (req.user.marksys_info[3][i].course_d_id == cdid) {
            right = true;
        }
    }
    return right;
}

function CheckCDID(req,cdid)
{    
    let right = false;
    if (req.user && req.user.marksys_info) {
        if (req.user.marksys_info[1][0].RoleID == 1
            || req.user.marksys_info[1][0].RoleID == 8
            || req.user.marksys_info[1][0].RoleID == 9
        ) {
            right = true;
        }
        else {
            for (let i = 0; i < req.user.marksys_info[2].length; i++) {
                if (req.user.marksys_info[2][i].course_d_id == cdid) {
                    right = true;
                }
            }
        }
    }
    return right;
}

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
        markadmin  :grp.GRP_R_MARK_ADMIN(req.user),
        pstafpanel :grp.GRP_R_Pri_OA(req.user),
        sstafpanel :grp.GRP_R_Sec_OA(req.user),
    });
}

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

//PINGYU
//PINGYU
router.get('/pingyu/:book', (req, res, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let staf_ref = netutils.id2staf(req.user);
    let fn = req.params.book + "評語";
    let aot = 10;
    let lno=req.query.lno;
    if (req.user&&req.user.marksys_info) {
        if (fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
    }    
    getModel().readpingyu(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudPingyu.pug', {
            profile: req.user,
            fn: fn,
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            esess: req.user.marksys_info[0][0],
            OpSect: GetAOTWith( req.params.book,req),
            aot:aot,
        });
    });
});
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
router.post('/studcourse/editpingyu/pingyusave', images.multer.single('image'), 
    (req, Response, next) => {
    let staf = "null";
    let stafref = "null";
    let aot =  req.query.aot;
    if (!aot && req.user) {   
        staf = req.user.id;      
        stafref = netutils.id2staf(req.user);
        if (req.user.marksys_info) {
            if (req.query.fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
            if (req.query.fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
        }
    }
    let myclass = GetMyClass(req);
    getModel().UpdatePingYu(aot,myclass,JSON.parse( req.body.datajson ), (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( `更新 ${entity} 筆. 完成! `);
    });
});

router.post('/studcourse/editpingyu/pingyusavejson', images.multer.single('image'), (req, Response, next) => {        
    let myclass = GetMyClass(req);
    //if (req.user) staf = req.user.id;
    let aot =  req.query.aot;
    getModel().UpdatePingYuArr(aot,myclass,req.body.data, (err, entity) => {
        if (err) { next(err); return; }        
        Response.write( "Update  Records:" );        
        Response.end( entity.toString());
    });
});
router.get('/studcourse/regpingyu/:book', (req, Response, next) => {
    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let cdid = req.params.book;
    let stafref = netutils.id2staf(req.user);
    let rurl = encodeURI(req.baseUrl) + `/pingyu/${cdid}?r=true&fn=` + encodeURI(req.query.fn);
    let parm = { cno: cdid, stafref: stafref, t: req.query.fn, returl: rurl };
    if (req.user && req.user.marksys_info) {
        netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/pingyu_grid_stud.php?` + querystring.stringify(parm), Response);
    } else {
        Response.end("no right");
    }
});
router.post('/studcourse/regpingyu/pingyu_jsontwolist.php', (req, Response, next) => {
    req.body.stafref = netutils.id2staf(req.user);
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/pingyu_jsontwolist.php', "rawData=" + JSON.stringify(req.body), Response);
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
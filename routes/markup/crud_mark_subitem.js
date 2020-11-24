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
function getModel() { return require(`./model-mysql-pool_subitem`); }
const router = express.Router();
// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
// Set Content-Type for all responses for these routes

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
    if(true){
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
    }else{
        http.get(
            {
                hostname: "127.0.0.1",
                port: 8082,
                path: "/api/VeriUser/get?User=" + req.user.username + "&Pwd=" + req.user.password ,
                method: 'GET',
            },
            (respone) => {
                respone.on('data', (d) => {
                    try {
                        if(d=="{}") return cb(null,null);
                        var json = JSON.parse(d.toString());
                        let esess=json.table[0];
                        let euser=json.table1[0];
                        let ecourse=json.table2;
                        let classcourse=json.table3;
                        req.user.marksys_info=[json.table,json.table1,json.table2,json.table3];
                        res.render('markup/index.pug', {
                            profile: req.user,
                            esess: esess,
                            euser: euser,
                            ecourse: ecourse,
                        });
                    } catch(x){
                        console.log(x);
                    }
                });
            }).on('error', (e) => {
                console.log(e);
            });
    }
}

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});
router.get('/', require('connect-ensure-login').ensureLoggedIn('/login?redirect=markup'), (req, res, next) => {
    showMarksysInfo(req, res);
});

router.get('/panelpstaf', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    if(grp.GRP_R_Pri_OA(req.user)||grp.GRP_R_Sec_OA(req.user)){
    let esess=req.user.marksys_info[0][0];
    let euser=req.user.marksys_info[1][0];
    let ecourse=req.user.marksys_info[2];
    let classcourse=req.user.marksys_info[3];
    res.render('markup/PanelPStaf.pug', {
        profile: req.user,
        esess: esess,
        euser: euser,
        ecourse: ecourse,
        eclasscourse: classcourse,
    });
   }else{
       res.end("no right!");
   }
});

router.get('/mycourse', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    res.render('markup/listCourse.pug', {
        profile: req.user,
        books: req.user.marksys_info[2],
        esess: req.user.marksys_info[0][0],
        editable: true,
    });
});

router.get('/myclass', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    res.render('markup/listCourse.pug', {
        books: req.user.marksys_info[3],
        editable: false,
        profile: req.user,
        esess: req.user.marksys_info[0][0],
    });
});

//myclassWRGTJ
router.get('/myclassWRGTJ', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    res.render('markup/WRGTJ/QForm.pug', {
        classno: req.user.marksys_info[1][0].classno,
        allowOpSect:req.user.marksys_info[0][0].allowOpSect,
        editable: false,
        profile: req.user,
    });
});

router.post('/myclassWRGTJ', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {    
    HttpPostMKWrgTotal("127.0.0.1", '/MKWrgTotal?r=random', querystring.stringify(req.body), res);
});

router.get('/myclassShowWRGTJ', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {    
    let data ={
    CalcFlag: false,
    cno: req.user.marksys_info[1][0].classno,
    SID: req.user.marksys_info[0][0].allowOpSect,
    sdate: '2019/03/27',
    edate: '2019/03/27',
    saveFlag: false};
    HttpPostMKWrgTotal("127.0.0.1", '/MKWrgTotal?r=random', querystring.stringify(data), res);
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

/**
 * GET /markup/add
 *
 * Display a form for creating a book.
 */
router.get('/add', (req, res) => {
    res.render('markup/form.pug', {
        profile: req.user,
        book: {
            author: req.user.username,
            authorname: req.user.displayName,
            logDate: netutils.fmt_now(),
            rootid: 0,
            title: fmt_title(req.user.username, netutils.fmt_now(), 'worklog')
        },
        action: 'Add'
    });
});

/**
 * POST /books/add
 * Create a book.
 */
// [START add]
router.post(
    '/post.php',
    images.multer.single('image'),
    (req, res, next) => {
        const data = req.body;
        getModel().create(data, (err) => {
            if (err) {
                next(err);
                return;
            }
            res.end("ok!!!")
            //res.redirect(`${req.baseUrl}/${savedData.id}`);
        });
    }
);

router.get('/marktotal/mrs_class_mark_total_tab_report.php', (req, Response, next) => {
    let param = {
        term: req.query.term,
        classno: netutils.id2classno(req.user),
        returl: encodeURI(req.baseUrl),
        stafref: netutils.id2staf(req.user)
    }
    netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/mrs_class_mark_total_tab_report.php?` + querystring.stringify(param), Response);
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
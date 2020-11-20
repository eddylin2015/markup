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
function getModel() { return require(`./model-mysql-pool`); }
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
router.get('/studcourse/:book', (req, res, next) => {
    if( CheckCDID(req,req.params.book)){}
    else if(CheckCLASSCDID(req,req.params.book) ){}
    else { res.end("no right");  return; }
    let staf_ref = netutils.id2staf(req.user);
    getModel().readstudcourse(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudCourse.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            esess: req.user.marksys_info[0][0],
            
        });
    });
});
router.get('/studcourse/:book/xls', (req, res, next) => {
    if( ! CheckCDID(req,req.params.book) ){ res.end("no right");  return; }
    let staf_ref = netutils.id2staf(req.user);
    let fn = req.query.fn + ".xls";
    res.setHeader("Content-type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(fn) + ";");
    res.write('<HTML xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">');
    res.write('<head><meta http-equiv="content-type" content="application/vndms-excel; charset=utf-8"></head>');
    res.write('<body><table><tbody>')
    res.write('<tr><td>編號<td>座號<td>姓名<td>測驗1<td>考試1<td>測驗2<td>考試2<td>測驗3<td>考試3<td>補考')
    getModel().readstudcourse(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        for (let i = 0; i < entity.length; i++) {
            res.write("<tr><td>" + entity[i].stud_c_id);
            res.write("<td>" + entity[i].seat + "<td>" + entity[i].c_name);
            res.write("<td>" + entity[i].t1 + "<td>" + entity[i].e1);
            res.write("<td>" + entity[i].t2 + "<td>" + entity[i].e2);
            res.write("<td>" + entity[i].t3 + "<td>" + entity[i].e3);
            res.write("<td>" + entity[i].pk + "</tr>");
        }
        res.write('</tbody></table></body></html>');
        res.end();
    });
});
router.get('/studcourse/editstudmark/:book', (req, Response, next) => {
    if( ! CheckCDID(req,req.params.book) ){ res.end("no right");  return; }
    let aot=GetAOT(req);
    let cdid = req.params.book;
    let staf_ref = netutils.id2staf(req.user);       
    //let parm = { aot: aot, cdid: cdipingyud, course: req.query.fn, returl: req.baseUrl + `/studcourse/${cdid}`,fn:req.query.fn };
    //netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/mark_grid.php?` + querystring.stringify(parm), Response);
    getModel().readstudcourse(staf_ref, req.params.book, (err, entity) => {
        if (err) {next(err);return;}
        Response.render('markup/editStudCourse.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            aot:aot
        });
    });   
});
router.post('/studcourse/editstudmark/marksave.php', images.multer.single('image'), (req, Response, next) => {    
    let staf = "null";
    if (req.user) staf = req.user.id;
    let aot = req.query.aot;
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/marksave.php', "aot=" + aot + "&stafref=" + staf + "&datajson=" + req.body.datajson, Response);
});
router.post('/studcourse/editstudmark/marksavejson', images.multer.single('image'), (req, Response, next) => {    
    let saot = GetSAOT(req);
    let paot = GetPAOT(req);
    let staf = "null";
    if (req.user) staf = req.user.id;
    let jsondata=JSON.stringify( {"saot": saot,"paot": paot, "stafref": staf,"mycrs": req.user.marksys_info[2], "data":req.body.data})
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/marksavejson.php',jsondata, Response);
});
router.get('/studcourse/regstudcourse/:book', (req, Response, next) => {
    let cdid = req.params.book;
    let ccno = "";
    let rurl = encodeURI(req.baseUrl) + `/studcourse/${cdid}?fn=` + encodeURI(req.query.fn);
    let stafref = netutils.id2staf(req.user);
    if (req.user && req.user.marksys_info) {        
        for (let i = 0; i < req.user.marksys_info[2].length; i++) {
            if (req.user.marksys_info[2][i].course_d_id == cdid) {
                ccno = req.user.marksys_info[2][i].classno;
                let parm = { ccno: ccno, stafref: req.user.id, cdid, course: req.query.fn, returl: req.baseUrl + `/studcourse/${cdid}`, fn: req.query.fn };
                netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/mark_grid_stud.php?` + querystring.stringify(parm), Response);
                return;
            }
        }
    } else {
        Response.end("no right");
    }
});
router.post('/studcourse/regstudcourse/markup_jsontwolist.php', (req, Response, next) => {
    req.body.stafref = netutils.id2staf(req.user);
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/markup_jsontwolist.php', "rawData=" + JSON.stringify(req.body), Response);
});

//CONDUCT
router.get('/conduct/:book', (req, res, next) => {

    if(!CheckCLASSNO(req,req.params.book)){ res.end("no right");return;}
    let staf_ref = netutils.id2staf(req.user);
    getModel().readconduct(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudConduct.pug', {
            profile: req.user,
            fn: req.params.book + "操行",
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            esess: req.user.marksys_info[0][0],
            OpSect: GetAOTWith( req.params.book,req),
        });
    });
});
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
    Response.setHeader('Content-Type', 'text/html');
    netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/condu_grid.php?` + querystring.stringify(parm), Response);
});
router.post('/studcourse/editcondu/condusave.php', images.multer.single('image'), (req, Response, next) => {
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
    let parm = { aot: aot, staf: staf, stafref: stafref, datajson: JSON.stringify(req.body.datajson) }
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/condu_save.php', querystring.stringify(parm), Response);
});
//
router.post('/studcourse/editcondu/condusavejson', images.multer.single('image'), (req, Response, next) => {    
    let saot = GetSAOT(req);
    let paot = GetPAOT(req);
    let staf = "null";
    let myclass = GetMyClass(req);
    if (req.user) staf = req.user.id;
    let jsondata=JSON.stringify( {myclass:myclass,"saot": saot,"paot": paot, "stafref": staf,"mycrs": req.user.marksys_info[2], "data":req.body.data});
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/condusavejson.php',jsondata, Response);
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
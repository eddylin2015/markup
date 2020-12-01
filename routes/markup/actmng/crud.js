// markup

'use strict';
const config = require('../../../config');
const PHP_HOST = config.get('PHP_HOST');
const PHP_PORT = config.get('PHP_PORT');
const express = require('express');
const images = require('./images');
const http = require('http');
const querystring = require('querystring');
const grp = require('../../../db/it_support_right');
var redis = require("redis"),
    client = redis.createClient();
const netutils = require('../../../lib/net_utils');
function getModel() { return require(`./model-mysql-pool_act`); }
const router = express.Router();

function GetCDIDS(req) {
    let right = [];
    if (req.user && req.user.marksys_info) {
        for (let i = 0; i < req.user.marksys_info[2].length; i++) {
            right.push(req.user.marksys_info[2][i].course_d_id);
        }
    }
    return right.join(",");
}
function CheckCDID(req, cdid, cdids) {
    if (cdids) return cdids.indexOf(cdid) > -1;
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

function GetAOT(req) {
    let aot = 10;
    if (req.user && req.user.marksys_info) {
        aot = req.user.marksys_info[0][0].allowOpSect; 
    }
    return aot;
}

function GetAOTWith(fn, req) {
    let aot = 10;
    if (req.user && req.user.marksys_info) {
        if (fn.startsWith("I")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (fn.startsWith("P")) { aot = req.user.marksys_info[0][0].p_allowOpSect; }
        if (fn.startsWith("S")) { aot = req.user.marksys_info[0][0].allowOpSect; }
    }
    return aot;
}

function GetSAOT(req) {
    return (req.user && req.user.marksys_info) ? req.user.marksys_info[0][0].allowOpSect : 10;
}
function GetPAOT(req) {
    return (req.user && req.user.marksys_info) ? req.user.marksys_info[0][0].p_allowOpSect : 10;
}
function GetMyClass(req) {
    return (req.user && req.user.marksys_info) ? req.user.marksys_info[1][0].classno : null;
}
function GetSID(req) {
    return (req.user && req.user.marksys_info) ? req.user.marksys_info[0][0].session_id : null;
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

function showMarksysInfo(req, res) {
    if (true) {
        let esess = req.user.marksys_info[0][0];
        let euser = req.user.marksys_info[1][0];
        let ecourse = req.user.marksys_info[2];
        let classcourse = req.user.marksys_info[3];
        res.render('markup/index.pug', {
            profile: req.user,
            esess: esess,
            euser: euser,
            ecourse: ecourse,
            eclasscourse: classcourse,
            markadmin: grp.GRP_R_MARK_ADMIN(req.user),
            pstafpanel: grp.GRP_R_Pri_OA(req.user),
            sstafpanel: grp.GRP_R_Sec_OA(req.user),
        });
    }
}

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

router.get('/', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    res.render('markup/actmng/index.pug', {
        profile: req.user,
        esess: req.user.marksys_info[0][0],
        sid:GetSID(req)
    });
});  
router.get('/cnolist', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    res.render('markup/actmng/cnolist.pug', {
        profile: req.user,
        esess: req.user.marksys_info[0][0],
        sid:GetSID(req),
        sect:req.query.cno,
    });
});  
////
router.get('/actlist', (req, Response, next) => {
    let aot = GetAOT(req);
    let sid= GetSID(req);
    let cno = 'actcid';
    let staf_ref = netutils.id2staf(req.user);
    getModel().ReadActDef( (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/actmng/editActList.pug', {
            profile: req.user,
            fn: `${cno}_act`,
            cno: cno,
            books: entity,
            editable: req.query.r,
            aot: aot,
            sid:sid
        });
    });
});
router.post('/actlistUpdate', images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot;
    let sid= GetSID(req);
    //console.log(req.body.datajson);
    let data=JSON.parse(req.body.datajson)
        getModel().UpdateActDef(data, (err, entity) => {
            if (err) { next(err); return; }
            Response.end(`更新${entity}筆...`);
        });
});
router.get('/actGrade/:book/edit', (req, Response, next) => {
    let aot = GetAOT(req);
    let sid= GetSID(req);
    let cno = req.params.book;
    let actcid=cno;
    let staf_ref = netutils.id2staf(req.user);
    getModel().ReadActivebyACTCID( actcid, (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/actmng/editAct.pug', {
            profile: req.user,
            fn: `${cno}_act`,
            cno: req.params.book,
            books: entity,
            editable: req.query.r,
            aot: aot,
            sid:sid
        });
    });
});
////

router.get('/studGrade/:book/edit', (req, Response, next) => {
    let aot = GetAOT(req);
    let sid= GetSID(req);
    let cno = req.params.book;
    let staf_ref = netutils.id2staf(req.user);
    getModel().readclassact(staf_ref, cno,sid, (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/actmng/editAct.pug', {
            profile: req.user,
            fn: `${cno}_act`,
            cno: req.params.book,
            books: entity,
            editable: req.query.r,
            aot: aot,
            sid:sid
        });
    });
});
////

////
//actUpdate
router.post('/studGradeUpdate', images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot;
    let sid= GetSID(req);
    //console.log(req.body.datajson);
    let data=JSON.parse(req.body.datajson)
    if ( data && (aot == 1 || aot == 2 || aot == 3)) {
        getModel().UpdateAct(data,sid,aot, (err, entity) => {
            if (err) { next(err); return; }
            Response.end(`第${aot}段, 更新${entity}筆...`);
        });
    } else {
        Response.end("Err");
    }
});


router.get('/regStud/:book', (req, Response, next) => {
    let cno = req.params.book;
    let rurl = encodeURI(req.baseUrl);// + `/act/${cno}?r=true&fn=` + encodeURI(req.query.fn);
    if(req.user && (req.user.id="2002024"))
    getModel().ReadClassStudAct(cno, (err, entity) => {
            if (err) { console.log(err);next(err); return; }
            Response.render('markup/actmng/regstud/studlist_act.pug', {
                profile: req.user,
                fn: cno,
                classno: cno,
                books: entity,
                rurl : rurl,
                jsontwolist_php:`markup_jsontwolist?cno=${cno}&fn=${encodeURI(cno)}`,
            });
        });
});

router.post('/regStud/markup_jsontwolist', (req, Response, next) => {
    let cno=req.query.cno;
    let sid= GetSID(req);
    let act_c_id=900;
    let key1=req.body.aObj? req.body.aObj:null;
    let key2=req.body.rObj? req.body.rObj:null;
    getModel().RegStudAct(sid, cno,act_c_id, key1, key2 , (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( entity.toString());
    });
    //Response.end(JSON.stringify(req.body))
    /*
    req.body.stafref = netutils.id2staf(req.user);
    let sid=GetSID(req);
    let cdid=req.query.cdid;
    let cno=req.query.ccno;
    getModel().RegStudCourse(sid, cdid, cno, key1, key2 , (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( entity.toString());
    });
    */
});







router.get('/studcourse/:book', (req, res, next) => {
    if (CheckCDID(req, req.params.book)) { }
    else if (CheckCLASSCDID(req, req.params.book)) { }
    else { res.end("no right"); return; }
    let staf_ref = netutils.id2staf(req.user);
    let aot = GetAOT(req);
    getModel().readstudcourse(staf_ref, req.params.book, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudCourse.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            esess: req.user.marksys_info[0][0],
            aot: aot
        });
    });
});

router.get('/studcourse/:book/xls', (req, res, next) => {
    if (!CheckCDID(req, req.params.book)) { res.end("no right"); return; }
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
    if (!CheckCDID(req, req.params.book)) { res.end("no right"); return; }
    let aot = GetAOT(req);
    let cdid = req.params.book;
    let staf_ref = netutils.id2staf(req.user);
    getModel().readstudcourse(staf_ref, cdid, (err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/editStudCourse.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: req.params.book,
            books: entity,
            editable: req.query.r,
            aot: aot
        });
    });
});
router.post('/studcourse/editstudmark/marksave.php', images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot;
    let data=JSON.parse(req.body.datajson)
    if (staf && data && (aot == 1 || aot == 2 || aot == 3)) {
        getModel().UpdateMark(data, (err, entity) => {
            if (err) { next(err); return; }
            Response.end(`第${aot}段, 更新${entity}筆...`);
        });
    } else {
        Response.end("Err");
    }
});

router.post('/studcourse/editstudmark/marksavejson', images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot?req.query.aot: GetAOT(req);
    let data = req.body.data;
    if ( staf && data && (aot == 1 || aot == 2 || aot == 3)) {
        let cdids = GetCDIDS(req);
        getModel().UpdateMarkArr(data,cdids, aot,(err, entity) => {
            if (err) { next(err); return; }
            Response.end(`第${aot}段, 更新${entity}筆...`);
        });
    } else {
        Response.end(JSON.stringify(req.body.data))
    }
});

router.get('/studcourse/regstudcourse.php/:book', (req, Response, next) => {
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

function ExpArrayToXls(arraydata_str, exportfilename, respone) {
    let param_postData = arraydata_str;
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/api/NpoiXls/ExpArrayToXls', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        respone.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(exportfilename) + ";");
        res.on('data', (chunk) => { respone.write(chunk); }); res.on('end', () => { respone.end(); });
    });
    req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    req.write(param_postData); req.end();
}

/**
 * Errors on "/studcourse/*" routes.
 */
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;

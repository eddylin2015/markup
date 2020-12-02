// markup

'use strict';
const express = require('express');
const images = require('./images');
const http = require('http');
const grp = require('../../../db/it_support_right');
const redis = require("redis");
const client = redis.createClient();
const netutils = require('../../../lib/net_utils');

function getModel() { 
    return require(`./model-mysql-pool_act`); 
}

function authRequired(req, res, next) {
    if (!req.user) {
        req.session.oauth2return = req.originalUrl;
        return res.redirect('/auth/login');
    }else if("2002024,2012008,2012020".indexOf(req.user.id)==-1){
        return res.end(`${req.user.id}please auth required for Markup_ActMng_Crud !`);
    }
    next();
}

const router = express.Router();

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

function GetSID(req) {
    return (req.user && req.user.marksys_info) ? req.user.marksys_info[0][0].session_id : null;
}

function showMarksysInfo(req, res) {
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

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

router.get('/', authRequired, (req, res, next) => {
    res.render('markup/actmng/index.pug', {
        profile: req.user,
        esess: req.user.marksys_info[0][0],
        sid:GetSID(req)
    });
});  

router.get('/cnolist', authRequired, (req, res, next) => {
    res.render('markup/actmng/cnolist.pug', {
        profile: req.user,
        esess: req.user.marksys_info[0][0],
        sid:GetSID(req),
        sect:req.query.cno,
    });
});  

router.get('/actlist',authRequired, (req, Response, next) => {
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

router.post('/actlistUpdate',authRequired, images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot;
    let sid= GetSID(req);
    let data=JSON.parse(req.body.datajson)
        getModel().UpdateActDef(data, (err, entity) => {
            if (err) { next(err); return; }
            Response.end(`更新${entity}筆...`);
        });
});

router.get('/actGrade/:book/edit',authRequired, (req, Response, next) => {
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

router.get('/studGrade/:book/edit',authRequired, (req, Response, next) => {
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

router.post('/studGradeUpdate',authRequired, images.multer.single('image'), (req, Response, next) => {
    let staf = req.user ? req.user.id : null;
    let aot = req.query.aot;
    let sid= GetSID(req);
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

router.get('/regStud/:book',authRequired, (req, Response, next) => {
    let cno = req.params.book;
    let rurl = encodeURI(req.baseUrl);
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

router.post('/regStud/markup_jsontwolist',authRequired, (req, Response, next) => {
    let cno=req.query.cno;
    let sid= GetSID(req);
    let act_c_id=900;
    let key1=req.body.aObj? req.body.aObj:null;
    let key2=req.body.rObj? req.body.rObj:null;
    getModel().RegStudAct(sid, cno,act_c_id, key1, key2 , (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( entity.toString());
    });
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

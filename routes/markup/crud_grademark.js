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
function getModel() { return require(`./model-mysql-pool_grademark`); }
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

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});


router.get('/studcourse/reggrademark/:book', (req, Response, next) => {
    let cno =req.query.cno; //req.params.book;
    let gcname=req.params.book;
    let cdid = req.params.book;
    let rurl = encodeURI(req.baseUrl) + `/grademark/${cdid}?r=true&cno=${cno}&fn=` + encodeURI(req.query.fn);
    getModel().ReadStudGradeCourse(cno, (err, entity) => {
        if (err) { console.log(err);next(err); return; }
        Response.render('markup/regstudcourse/studlist_grademark.pug', {
            profile: req.user,
            fn: req.query.fn,
            gcname:gcname,
            classno: cno,
            books: entity,
            rurl : rurl,
            jsontwolist_php:`gradecourse_jsontwolist.php?gc=${encodeURI(gcname)}`,
        });
    });
});
router.post('/studcourse/reggrademark/gradecourse_jsontwolist.php', (req, Response, next) => {
    let key1=req.body.aObj? Object.keys(req.body.aObj):null;
    let key2=req.body.rObj? Object.keys(req.body.rObj):null;
    getModel().updateGCNameArray(req.query.gc, key1,key2 , (err, entity) => {
        if (err) { next(err); return; }        
        Response.end( entity.toString());
    });
});

router.get('/studcourse/regstudgradecourse/:book', (req, Response, next) => {
    let cno =req.params.book; //req.params.book;
    let rurl = encodeURI(req.baseUrl) + `/grademarkregstud/` ;
    getModel().ReadClassStudGradeCourse(cno, (err, entity) => {
        if (err) { console.log(err);next(err); return; }
        Response.render('markup/regstudcourse/studlist.pug', {
            profile: req.user,
            classno: cno,
            books: entity,
            rurl : rurl,
            jsontwolist_php:"gradecourse_jsontwolist.php?gc=",
        });
    });
});
router.post('/studcourse/regstudgradecourse/gradecourse_jsontwolist.php', (req, Response, next) => {
    //Response.end(JSON.stringify(req.body.aObj));
    let gcname=req.query.gc;
    if(req.body.aObj){
        getModel().UpdateStudGradeCourse(req.body.aObj,gcname ,(err, savedData) => {
            if (err) {
                next(err);
                return;
            }
            res.end(`${savedData}`);
        });
    }else{
        Response.end(req.body.aObj);
    }
});
//grademark
router.get('/grademarkregstud', (req, res, next) => {
    res.render('markup/editRegStudGrademark.pug', {
        profile: req.user,
    });
});
//grademarkregstud
router.post('/grademarkregstud', images.multer.single('image'), (req, res, next) => {
    if(!req.body.stud) {res.end("emty");return;}
    getModel().updateGCNameArray(req.body.crs, req.body.stud , null,(err, entity) => {
        if (err) { next(err); return; }        
        res.end( entity.toString());
    });
});
router.get('/grademarkstud_list_data_json/:cno', (req, res, next) => {
    let cno = req.params.cno;
    let sql=null;
    if (cno.indexOf('P')>-1){
        sql="select stud_ref,classno,seat,c_name,GC_Name from mrs_stud_grade_course where classno='" + cno + "'"
    }else if(cno.indexOf('選修課-')>-1){
        switch(cno){
            case "選修課-STEM":
            case "選修課-合唱團":                
            case "選修課-管弦樂團":
            case "選修課-舞蹈團":                
            case "選修課-體能訓練":
                    sql="select stud_ref,classno,seat,c_name,GC_Name from mrs_stud_grade_course where GC_NAME='" + cno + "'"
                    break;
            default:
                res.end('[]');  return; 
        }
    }
    if(sql==null){ res.end('[]');  return; }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    getModel().DataReaderQuery(sql,
        (err, entities, cursor, apiResponse) => {
            if (err) {
                next(err);
                return;
            }
            res.write("[")
            for (let i = 0; i < entities.length; i++) {
                let tmp = entities[i].classno + "_" + (entities[i].seat < 10 ? "0" : "") + entities[i].seat + "_" + entities[i].c_name + "_" + entities[i].GC_Name + "_" + entities[i].stud_ref;
                res.write('"' + tmp + '",');
            }
            res.end('"stud_ref"]');
        }
    );
});


router.get('/grademark/:book', (req, res, next) => {
    let cno=req.query.cno;
    let editable=false;
    if(grp.GRP_R_Pri_IE_CRS(req.user)||CheckCLASSNO(req,req.params.book))
    {
        editable=true;
    }else{ res.end("no right");return;}
    let staf_ref = netutils.id2staf(req.user);
    getModel().readgrademark(staf_ref, req.params.book,cno, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/viewStudGrademark.pug', {
            profile: req.user,
            fn: req.params.book + "_grademark",
            course_d_id: req.params.book,
            cno:req.query.cno,
            books: entity,
            editable: editable //req.query.r,
        });
    });
});

router.get('/grademarkxls/:book',(req, res, next)=>{
    let cno=req.query.cno;
    let staf_ref = netutils.id2staf(req.user);
    let farr=["stud_ref","classno","seat","c_name","GC_Name","grade1","grade2","grade3","sgcid"];
    if(req.query.term){
        if(req.query.term=='1') farr=["stud_ref","classno","seat","c_name","GC_Name","grade1","sgcid"];
        if(req.query.term=='2') farr=["stud_ref","classno","seat","c_name","GC_Name","grade2","sgcid"];
        if(req.query.term=='3') farr=["stud_ref","classno","seat","c_name","GC_Name","grade3","sgcid"];
    }
    getModel().readgrademark(staf_ref, req.params.book,cno, (err, rows) => {
        if (err) { next(err); return; }       
        var arr=new Array();   
        arr.push(farr);
        for(let i=0;i<rows.length;i++)
        {
          var arritem=new Array();
          let tds=rows[i];
          for(let j=0;j<farr.length;j++)
          arritem.push(tds[farr[j]]);
          arr.push(arritem) 
        }
        ExpArrayToXls(JSON.stringify(arr),req.params.book+"_grademark.xls",res);
    });
});
router.get('/grademarkxlsSelector',(req, res, next)=>{
    let staf_ref = netutils.id2staf(req.user);
    let classno=req.query.classno;
    let farr=["stud_ref","classno","seat","c_name","GC_Name","grade1","grade2","grade3","sgcid"];
    if(req.query.term){
        if(req.query.term=='1') farr=["stud_ref","classno","seat","c_name","GC_Name","grade1","sgcid"];
        if(req.query.term=='2') farr=["stud_ref","classno","seat","c_name","GC_Name","grade2","sgcid"];
        if(req.query.term=='3') farr=["stud_ref","classno","seat","c_name","GC_Name","grade3","sgcid"];
    }
    getModel().readgrademark(staf_ref, classno, (err, rows) => {
        if (err) { next(err); return; }       
        var arr=new Array();   
        arr.push(farr);
        for(let i=0;i<rows.length;i++)
        {
          var arritem=new Array();
          let tds=rows[i];
          for(let j=0;j<farr.length;j++)
          arritem.push(tds[farr[j]]);
          arr.push(arritem) 
        }
        ExpArrayToXls(JSON.stringify(arr),classno+"_grademark.xls",res);
    });
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
router.get('/grademarkSelect', (req, res, next) => {
  let classno=req.query.classno;
  res.redirect(`/internal/markup/grademark/${classno}`);
});

router.get('/studcourse/editgrademark/:book', (req, Response, next) => {
    if(!grp.GRP_R_Pri_IE_CRS(req.user)){res.end("no right");return;}
    let grademark_d_id = req.params.book;    
    let aot=req.user.marksys_info[0][0].p_allowOpSect;    
    let staf_ref = netutils.id2staf(req.user);      
    let cno=req.query.cno;
    getModel().readgrademark(staf_ref, req.params.book, cno,(err, entity) => {
        if (err) { next(err); return; }
        Response.render('markup/editStudGrademark.pug', {
            profile: req.user,
            fn: req.query.fn,
            course_d_id: grademark_d_id,
            books: entity,
            editable: req.query.r,
            aot:aot
        });
    });
});
router.post('/studcourse/editgrademark/grademarksave.php', images.multer.single('image'), (req, Response, next) => {
    if(!grp.GRP_R_Pri_IE_CRS(req.user)){res.end("no right");return;}
    let staf = req.user.id;
    let stafref = netutils.id2staf(req.user);
    let aot = GetAOT(req);
    getModel().savegrademark(stafref,JSON.parse( req.body.datajson), (err, entity) => {
        if (err) { next(err); return; }        
        Response.end(`第${aot}段,更新${Math.floor(entity/100)}筆, 成功!`);
    });
});

router.post('/studcourse/editgrademark/grademarksavejson.php', images.multer.single('image'), (req, Response, next) => {
    if(!grp.GRP_R_Pri_IE_CRS(req.user)){res.end("no right");return;}
    let paot =  req.user.marksys_info[0][0].p_allowOpSect;
    let data=req.body.data;
    if(paot=="1"||paot=="2"||paot=="3"){
        let fieldn='grade'+paot;
        getModel().savegrademarkarray(fieldn, data , (err, entity) => {
            if (err) { next(err); return; }
            Response.end(`第${paot}段, 更新${entity}筆...`);        
        });
    }else{
        Response.end("error aot!");
    }
});

/*
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
*/
/*
router.get('/studcourse/reggrademark/:book', (req, Response, next) => {
    if(!grp.GRP_R_Pri_OA(req.user)){res.end("no right");return;}

    let cdid = req.params.book;
    let ccno = "";
    let rurl = encodeURI(req.baseUrl) + `/grademark/${cdid}?r=true&fn=` + encodeURI(req.query.fn);
    let parm = { cno: cdid, stafref: "", course: req.query.fn, returl: rurl };
    if (req.user && req.user.marksys_info) parm.stafref = netutils.id2staf(req.user);
    netutils.HttpGet(PHP_HOST, `/a/markups/mrscourse/gcourse_grid_stud.php?` + querystring.stringify(parm), Response);
});
router.post('/studcourse/reggrademark/gcourse_grid_jsontwolist.php', (req, Response, next) => {
    req.body.stafref = netutils.id2staf(req.user);
    netutils.HttpPost(PHP_HOST, '/a/markups/mrscourse/gcourse_grid_jsontwolist.php', "rawData=" + JSON.stringify(req.body), Response);
});*/


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
// markup

'use strict';

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

router.get('/ObserveList', (req, res, next) => {
    let staflist=[];
    let staf_ref = req.user.id;
    getModel().listObserveListSCID(staf_ref,(err,entity) => {
        if (err) {
            next(err);
            return;
        }
        for(let i=0;i<entity.length;i++)
        {
            staflist.push(entity[i].course_d_id)
        }

        res.render('markup/subitem/ObservelistCourseSubItem.pug', {
            profile: req.user,
            ObserveStafList:staflist,
        });
    
    }  );

});

router.get('/ObserveJSONList/:book', (req, res, next) => {
    let staf_ref = req.params.book;
    //let staf_ref = netutils.id2staf(req.user);
    getModel().ObserveListCourseSubitemBySCID(staf_ref, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.end(JSON.stringify(entity));
    });
});
router.get('/RegObserver', (req, res, next) => {
    //let staflist=["2000-003","2012-003"];
    let staf_ref = netutils.id2staf(req.user);
    getModel().listCourseBy(staf_ref,req.user.id,100,0,(err,entity) => {
        if (err) {
            next(err);
            return;
        }
        res.render('markup/subitem/RegObserver.pug', {
            profile: req.user,
            crslist: entity
        });
    }  );
});
router.post('/RegObserver', (req, res, next) => {
    let staf_ref = netutils.id2staf(req.user);
    let csid=req.body.csid;
    let obsid=req.body.obsid;
    let staf=req.body.staf;
    //console.log(staf_ref,staf,csid,obsid);
    getModel().RegObserver(staf_ref,staf,csid,obsid,(err,entity) => {
        if (err) {
            next(err);
            return;
        }
        res.end(entity.toString());
    }  );
});

router.get('/coursesubitem/xls/:book', (req, res, next) => {
    let staf_ref = netutils.id2staf(req.user);
    getModel().readcoursesubitem( req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        let fn=entity[0].c_sid+'_'
               +entity[0].course_d_id+'_'
               +entity[0].classno+"_"
               +entity[0].courseName+"_"
               +entity[0].subitem+"_"
               +".xls";
        if(entity[0].DataJson){
            //res.end(JSON.stringify(entity));
            ExpArrayToXls(entity[0].DataJson,fn,res);

        }else{
            getModel().readclassnostud(entity[0].classno,(err,rows)=>{
                //res.end(JSON.stringify(resu));    
                let farr=["c_sid","coures_d_id","stud_ref","curr_class","curr_seat","c_name","e_name","mark"];
                var arr=new Array();   
                arr.push(farr);
                for(let i=0;i<rows.length;i++)
                {
                  var arritem=new Array();
                  let tds=rows[i];
                  arritem.push(entity[0].c_sid);
                  arritem.push(entity[0].course_d_id);
                  for(let j=2;j<farr.length-1;j++)
                  arritem.push(tds[farr[j]]);
                  arr.push(arritem) 
                }
                
                ExpArrayToXls(JSON.stringify(arr),fn,res);
            });
        }
    });
});
router.get('/grademarkxlsSelector',(req, res, next)=>{
    let staf_ref = netutils.id2staf(req.user);
    let classno=req.query.classno;
    if(req.query.term){
        if(req.query.term=='1') farr=["stud_ref","classno","seat","c_name","GC_Name","grade1"];
        if(req.query.term=='2') farr=["stud_ref","classno","seat","c_name","GC_Name","grade2"];
        if(req.query.term=='3') farr=["stud_ref","classno","seat","c_name","GC_Name","grade3"];
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
router.post('/updateDataJson', (req, res, next) => {
    let data=req.body;
    getModel().updateCoursesubitemDataJson(data.csid, data.cdid , data.data ,(err,entity)=>{
        if (err) {
            next(err);
            return;
        }
        res.end("更新"+entity.affectedRows+"筆記錄!");
    });
});
router.get('/coursesubitem/:book', (req, res, next) => {
    
    //if( CheckCDID(req,req.params.book)){}
    //else if(CheckCLASSCDID(req,req.params.book) ){}
    //else { res.end("no right");  return; }
    
    let staf_ref = netutils.id2staf(req.user);
    getModel().listcoursesubitem(staf_ref, req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.end(JSON.stringify(entity));
    });
});

router.post('/coursesubitem/add', (req, res, next) => {
    
    //if( CheckCDID(req,req.params.book)){}
    //else if(CheckCLASSCDID(req,req.params.book) ){}
    //else { res.end("no right");  return; }
    let data=req.body;
    let staf_ref = netutils.id2staf(req.user);
    getModel().addcoursesubitem( data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.end(JSON.stringify(savedData));
        //res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
    
    /*
    getModel().listcoursesubitem(staf_ref, req.params.book, (err, entity) => {
        //if (err) { next(err); return; }
        res.render('markup/subitem/listCourseSubItem.pug', {
            profile: req.user,
            course_d_id: req.params.book,
            books: entity,
        });
    });*/
});
router.get('/coursesubitem/view/:book', (req, res, next) => {
    getModel().readcoursesubitem( req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.end(JSON.stringify(entity));
    });
});
router.post('/coursesubitem/save', (req, res, next) => {
    
    //if( CheckCDID(req,req.params.book)){}
    //else if(CheckCLASSCDID(req,req.params.book) ){}
    //else { res.end("no right");  return; }
    let data=req.body;
    
    let staf_ref = netutils.id2staf(req.user);
    getModel().savecoursesubitem( data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.end(JSON.stringify(savedData));
        //res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
    
    /*
    getModel().listcoursesubitem(staf_ref, req.params.book, (err, entity) => {
        //if (err) { next(err); return; }
        res.render('markup/subitem/listCourseSubItem.pug', {
            profile: req.user,
            course_d_id: req.params.book,
            books: entity,
        });
    });*/
});
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;
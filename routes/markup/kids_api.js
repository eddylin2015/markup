'use strict';
const zlib = require('zlib');
const express = require('express');
const images = require('./images');
const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const pug = require('pug');
const netutils = require('../../lib/net_utils');
function getModel() {
    return require(`./model-mysql-pool`);
}
const router = express.Router();

router.get('/', (req, res) => {
    res.render('markup/kidreport/index.pug', {
        profile:req.user
    });
});
router.get('/KSCORE/:book', (req, res) => {
    let classno=req.params.book;
    let param_postData = querystring.stringify({cno:classno});    
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/api/KSCORE/json?cno='+classno+"&r=" + Math.random(), method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let queryreq = http.request(options, (response) => {
        response.setEncoding('utf8'); 
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            //rawData = rawData.toString().replace(/\w+:/g, function (x) { return '"' + x.replace(":", '":'); });
            rawData = rawData.replace('"[{',"[{");
            rawData = rawData.replace('}]"',"}]");
            rawData = rawData.toString().replace(/\\"/g,'"');
            rawData = rawData.toString().replace(/\\\\"/g,'&quot;');
            try {
              let books = JSON.parse(decodeURI(rawData));
              res.render('markup/kidreport/KSCORE.pug',{ books: books});
            } catch (x) {
                res.writeHeader(200, {'Content-Type':'text/plain;charset=UTF-8'})
                res.end(rawData);
               console.error(x);
            }
        });
    });
    queryreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    queryreq.write(param_postData);
    queryreq.end();
});
router.get('/KASSESS/:book', (req, res) => {
    let classno=req.params.book;
    let param_postData = querystring.stringify({cno:classno});    
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/api/KASSESS/json?cno='+classno+"&r=" + Math.random(), method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let queryreq = http.request(options, (response) => {
        response.setEncoding('utf8'); 
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            rawData = rawData.toString().replace(/\w+:/g, function (x) { return '"' + x.replace(":", '":'); });
            rawData = rawData.replace('"{',"{");
            rawData = rawData.replace('}"',"}");
            rawData = rawData.toString().replace(/\\"/g,'"');
            rawData = rawData.toString().replace(/\\\\"/g,'&quot;');
            try {
              let books = JSON.parse(decodeURI(rawData));
              res.render('markup/kidreport/KASSESS.pug',{ books: books,rowcnt: books.length,txt:rawData});
            } catch (x) {
                res.writeHeader(200, {'Content-Type':'text/plain;charset=UTF-8'})
                res.end(rawData);
               console.error(x);
            }
        });
    });
    queryreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    queryreq.write(param_postData);
    queryreq.end();
});
router.get('/markstatisrawdatalistclass', (req, res) => {
    var sql = "SELECT classno FROM eschool.sclass where classno >'P' order by class;";
    getModel().StatisticsRead(sql, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/markstatisrawdata/listclass.pug', {profile:req.user, books: entity });
    });
});
router.get('/mark_report_mrs_course_list', (req, res) => {
    let c=req.query.c;
    let orderby=req.query.orderby;
    orderby = orderby ? orderby.replace( /(\w+)\s(\w+)/, '$2,$1'):"classno,staf_ref";  
    var sql='SELECT course_d_id, mrs_course_detail.classno, mrs_course_detail.staf_ref, c_name, coursename, c_t_type, c_field, c_section_total, tab, groupid,rate, filename, upcnt '+
    ' FROM mrs_course_detail '+
    ' LEFT JOIN es_user ON mrs_course_detail.staf_ref = es_user.staf_ref'+
    ' WHERE session_id >0 ';
    if(c=="P") {sql+=" and mrs_course_detail.classno like 'P%'";}
    if(c=="S") {sql+=" and mrs_course_detail.classno like 'S%'";}
    if(orderby=="classno,tab"||orderby=="classno,staf_ref"||orderby=="staf_ref,classno"||orderby=="staf_ref,tab"){
        sql+=" ORDER BY "+orderby;
    }
    else{
        sql+=' ORDER BY classno,staf_ref';
    }
    getModel().DataReaderQuery(sql, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/statistics/report_mrs_course_list.pug', { books: entity });
    });
});
router.get('/mark_report_mrs_course_table', (req, res) => {
    let c=req.query.c;
    let orderby=req.query.orderby;
    orderby = orderby ? orderby.replace( /(\w+)\s(\w+)/, '$2,$1'):"classno,tab";  
    var sql='SELECT course_d_id, mrs_course_detail.classno, mrs_course_detail.staf_ref, c_name, coursename, c_t_type, c_field, c_section_total, tab, groupid,rate, filename, upcnt '+
    ' FROM mrs_course_detail '+
    ' LEFT JOIN es_user ON mrs_course_detail.staf_ref = es_user.staf_ref'+
    ' WHERE session_id >0 ';
    if(c=="P") {sql+=" and mrs_course_detail.classno like 'P%'";}
    if(c=="S") {sql+=" and mrs_course_detail.classno like 'S%'";}
    sql+=" ORDER BY "+orderby;
    getModel().DataReaderQuery(sql, (err, entity) => {
        if (err) { next(err); return; }
        res.render('markup/statistics/report_mrs_course_table.pug', { books: entity });
    });
});

function fmt_now() {
    var d = new Date();
    var dstr = (d.getDate() < 10 ? "0" : "") + d.getDate() + "/" + (d.getMonth() < 9?"0":"")+ (d.getMonth() + 1) + "/"  + d.getFullYear() ;
    return dstr;
}
router.get('/InputMarkReportParam', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    let e = { pdate: fmt_now(), sess: "1819", session: "", classno: "SG1A" ,SPK:"0",aoflag:0,term:3};
    if (req.user && req.user.marksys_info && req.user.marksys_info[0][0]) {
        let mrs = req.user.marksys_info[0][0];
        e.sess = mrs.session_desc;
        e.session = mrs.session;
        e.classno=netutils.id2classno(req.user);
        e.SPK = req.user.marksys_info[1][0].SPK;
        e.aoflag = mrs.P_allowOpSect;
        if (e.SPK==1) e.aoflag = mrs.allowOpSect;
        e.term = e.aoflag;
        if (e.aoflag == 1) { e.pdate = mrs.date1; }
        else if (e.aoflag == 2) { e.pdate = mrs.date2 }
        else { e.pdate = mrs.date3; }
    }
    res.render('markup/markreport/InputMarkReportParam.pug', { cfg: e, profile: req.user,});
});

/*
Input MarkReport Parameters
{
    pdate: req.body.pdate,
    sess: req.body.sess,
    session: req.body.session,
    term: req.body.term,           
    cno: req.body.classno,
    classno: req.body.classno,            
    SPK: req.body.SPK,          //SPK 1,2,4
    aoflag: req.body.aoflag,   
    filter: filter,             //none 1,2,3,4
    mg: req.body.mg,            // m / g            
    fmt: req.body.fmt,          // mfmttermp/docx/xls/json
    calcopt:                    // calcopt : calc/readonly/calcupdate
    update_PubDate:             // update_PubDate / none
}
*/
router.post('/InputMarkReportParam',
    images.multer.single('image'),
    (req, res) => {                
        var regexp = /\d+/gi;
        let filter = req.body.filter == "none" ? null : req.body.filter.match(regexp);
        let e= req.body;
        e.filter=filter;
        e.cno=req.body.classno;
        if (e.update_PubDate == "update_PubDate")
        {
            if (e.term == "1") { getModel().updateMrkPubDate({ date1: e.pdate }); }
            if (e.term == "2") { getModel().updateMrkPubDate({ date2: e.pdate }); }
            if (e.term == "3") { getModel().updateMrkPubDate({ date3: e.pdate }); }
        }
        if (e.fmt == 'docx') {
            MarkDocx(req, res, e);
        } else {
            markstatis_data(req, res,  e);
        }
});
router.get('/InputMarkNoticParam', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    let e = { pdate: fmt_now(), sess: "1819", session: "", classno: "SG1A" ,SPK:"0",aoflag:0,term:3};
    if (req.user && req.user.marksys_info && req.user.marksys_info[0][0]) {
        let mrs = req.user.marksys_info[0][0];
        e.sess = mrs.session_desc;
        e.session = mrs.session;
        e.classno=netutils.id2classno(req.user);
        e.SPK = req.user.marksys_info[1][0].SPK;
        e.aoflag = mrs.P_allowOpSect;
        if (e.SPK==1) e.aoflag = mrs.allowOpSect;
        e.term = e.aoflag;
        if (e.aoflag == 1) { e.pdate = mrs.date1; }
        else if (e.aoflag == 2) { e.pdate = mrs.date2 }
        else { e.pdate = mrs.date3; }
    }
    res.render('markup/markreport/InputMarkNoticParam.pug', { cfg: e, profile: req.user,});
});
router.post('/InputMarkNoticParam',
    images.multer.single('image'),
    (req, res) => {                
        var regexp = /\d+/gi;
        let filter = req.body.filter == "none" ? null : req.body.filter.match(regexp);
        let e= req.body;
        e.filter=filter;
        e.cno=req.body.classno;
        markstatis_data(req, res,  e);
});
router.get('/MarkNotice',  (req, res) => {    
    var regexp = /\d+/gi;
    let filter = req.query.filter == "none" ? null : req.query.filter.match(regexp);  
    let fmt=req.query.term==4? "mfmfinal":"mfmttermp";    
    let e={
        fn : req.query.cno + ".xls",
        cno : req.query.cno.toUpperCase(),
        classno: req.query.cno.toUpperCase(),
        term : req.query.term,
        pdate :req.query.pdate,
        session : req.query.sessdesc,
        sess : req.query.sessid,
        filter :  filter,
        fmt: fmt,     
        mg: req.query.mg,
        update_PubDate:"none",
        calcopt:"calc",
        SPK:1,
        aoflag:3
    };          
    markstatis_data(req, res,  e);
});
router.get('/MARKSTATISTICSFORM/:book',  (req, res) => {    
    let term=req.query.term;    
    let cno=req.params.book;
    if(term=="1"||term=="2"||term=="3"||term=="4") {}else{res.end("Error Term!");return;}
    let e={
        fmt:"mark_statistics_form_20181212",
        classno: cno.toUpperCase(),
        term : term,
        filter :  "none",
        calcopt:"calc",
    };          
    markstatis_data(req, res,  e);
});
function MarkDocx(request, respone, e) {
    let exportfilename = e.cno + ".xml";   
    let param_postData = querystring.stringify(e);
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/MRSCLASSMARKSCORETABDOCX?' + Math.random(), method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8'); let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            let filename = rawData;//.toString().replace(/\W+/, '');
            try {

                if (fs.existsSync(filename)) {
                    respone.setHeader("Content-type", "application/vnd.ms-word");
                    respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(exportfilename) + ";");
                    let gzip_flag=true;
                    if(!gzip_flag){
                        fs.createReadStream(filename).pipe(respone);
                    }else{
                        let raw = fs.createReadStream(filename);
                        let acceptEncoding = request.headers['accept-encoding'];
                        if (!acceptEncoding) { acceptEncoding = '';  }
                        if (/\bgzip\b/.test(acceptEncoding)) {
                            respone.writeHead(200, { 'Content-Encoding': 'gzip' });
                          raw.pipe(zlib.createGzip()).pipe(respone);
                        } else if (/\bdeflate\b/.test(acceptEncoding)) {
                            respone.writeHead(200, { 'Content-Encoding': 'deflate' });
                          raw.pipe(zlib.createDeflate()).pipe(respone);
                        } else  {
                            respone.writeHead(200, {});
                          raw.pipe(respone);
                        }
                    }
                } else {
                    respone.writeHead(404, { 'Content-Type': 'text/html' });
                    return respone.end("404 Not Found");
                }
            } catch (err) { console.log(err); }
        });
    });
    req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    req.write(param_postData);
    req.end();
}
function markstatis_data_(request, respone, fmt){

    let data={
        fn : request.params.book + ".xls",
        cno : request.params.book.toUpperCase(),
        classno: request.params.book.toUpperCase(),
        term : request.query.term,
        pdate : netutils.id2pdate(request.user, request.query.term),
        session : netutils.id2session(request.user),
        sess : netutils.id2sessiondesc(request.user),
        filter :  "none",
        fmt: fmt,     
        mg:"m",
        update_PubDate:"none",
        calcopt:"calc",
        SPK:1,
        aoflag:3
    };
    //calcopt:   calcopt : calc/readonly/calcupdate
    if(fmt=='mfmttermp'){
        //data.calopt="calcupdate";
        if(data.cno.indexOf("E")>0) data.mg=request.query.mg;
        data.calopt="calcupdate";
        markstatis_data(request, respone, data);
    }
    else if(fmt=='finalreport'){
        //data.calopt="calcupdate";
        if(data.cno.indexOf("E")>0) data.mg=request.query.mg;
        data.fmt="docx";
        MarkDocx(request, respone, data);
    }
    else{
        data.calopt="calcupdate";
        markstatis_data(request, respone, data);
    }
}
function markstatis_data(request, respone, data) {
    //let param_postData = "calcopt=calc/calcupdate&cno=" + request.params.book;
    let fmt=data.fmt;
    data.fn = data.classno + ".xls";
    data.cno = data.classno.toUpperCase();
    data.classno = data.classno.toUpperCase();
    let  param_postData = "calcopt=calcupdate&cno=" + data.classno + "&filter=" + data.filter;
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/MRSCLASSMARKSCORETABJSON?' + param_postData, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8'); 
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            if (fmt == 'json') { respone.end(rawData); } 
            else {
                try {
                    //rawData = rawData.toString().replace(/\W+\[/, '[');
                    rawData = rawData.toString().replace(/\w+:/g, function (x) { return '"' + x.replace(":", '":'); });
                    data.books = JSON.parse(rawData);
                    if (fmt == 'json') { respone.end(rawData); } 
                    else if (fmt == 'xls') {
                        respone.setHeader("Content-type", "application/vnd.ms-excel");
                        respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(data.fn) + ";");
                        respone.end(pug.renderFile(process.cwd() + '/views/markup/markreport/fmtxls.pug', data));
                    }else if(fmt == "mark_statistics_form_20181212")
                    {
                        if(data.term==1) respone.render('markup/markreport/mark_statistics_form_20181212.1.pug', data);                        
                        if(data.term==2) respone.render('markup/markreport/mark_statistics_form_20181212.2.pug', data);                        
                        if(data.term==3) respone.render('markup/markreport/mark_statistics_form_20181212.3.pug', data);                        
                        if(data.term==4) respone.render('markup/markreport/mark_statistics_form_20181212.4.pug', data);                        
                    }else if (fmt == 'mfmttermp') {
                        if (data.cno.indexOf('P')>=0) {
                            respone.render('markup/markreport/mfmt_term_p.pug', data);
                        } else if (data.cno.indexOf('E')>=0 && data.mg=="g" ) {
                            respone.render('markup/markreport/mfmt_term_e.g.pug', data);
                        } else if (data.cno.indexOf('E')>=0  ) {
                            respone.render('markup/markreport/mfmt_term_e.pug', data);
                        } else if ( data.mg=="g") {
                             respone.render('markup/markreport/mfmt_term_s.g.pug', data);    
                        } else {
                            respone.render('markup/markreport/mfmt_term_s.pug', data);
                        }
                    }else if( fmt == 'mfmfinal'){
                        if (data.cno.indexOf('P')>=0) {
                            respone.render('markup/markreport/mfmt_final_p.pug', data);
                        } else if ( data.mg=="g") {
                            respone.render('markup/markreport/mfmt_final_s.pug', data);
                        } else if (data.cno.indexOf('E')>=0) {
                            respone.render('markup/markreport/mfmt_final_s.pug', data);
                        } else {
                            respone.render('markup/markreport/mfmt_final_s.pug', data);
                        }
                    }                 
                    else { respone.end(rawData); }
                } catch (x) {
                    respone.writeHeader(200, {'Content-Type':'text/plain;charset=UTF-8'})
                    respone.end(rawData);
                    console.error(x);
                }
            }
        });
    });
    req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    req.write(param_postData);
    req.end();
}
router.get('/markstatisrawdata/:book/json', (request, respone, next) => {
    markstatis_data_(request, respone, "json");
});
router.get('/markstatisrawdata/:book/xls', (request, respone, next) => {
    markstatis_data_(request, respone, "xls");
});
router.get('/markstatisrawdata/:book/termreport', (req, res, next) => {
    //markstatis_data_(req, res, "mfmttermp");
    //markstatis_data_(req, res, "mfmttermp");
    
    var regexp = /\d+/gi;
    let cno=req.params.book;
    let filter = "none";
    if(req.query.filter) filter =  req.query.filter.match(regexp);  
    let term=req.user.marksys_info[0][0].allowOpSect;
    if(req.query.term) term= req.query.term ;
    let pdate="";
    if(term=="1") pdate=req.user.marksys_info[0][0].date1;
    if(term=="2") pdate=req.user.marksys_info[0][0].date2;
    if(term=="3") pdate=req.user.marksys_info[0][0].date3;
    if(req.query.pdate) pdate=req.query.pdate;
    let session = req.user.marksys_info[0][0].session;
    if(req.query.sessdesc){session=req.query.sessdesc;}    
	let sess =  req.user.marksys_info[0][0].session_desc;
	if(req.query.sessid) {sess=req.query.sessid;}
    let fmt=term==4? "mfmfinal":"mfmttermp";      
    let e={
        fn : cno + ".xls",
        cno : cno.toUpperCase(),
        classno: cno.toUpperCase(),
        term : term,
        pdate : pdate,
        session : session,
        sess : sess,
        filter :  filter,
        fmt: fmt,     
        mg: req.query.mg,
        update_PubDate:"none",
        calcopt:"calc",
        SPK:1,
        aoflag:3
    };         
    
    markstatis_data(req, res,  e);	
});
router.get('/markstatisrawdata/:book/finalreport', (request, respone, next) => {
    markstatis_data_(request, respone, "finalreport");
});
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;

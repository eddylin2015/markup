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

router.get('/statisticsengtotal', (req, res) => {
    // 總分列表(包括英文,會話)  by {中, 英, 數}
    var re = /\W/g;
    var str = '';
    var totalpug='markup/statistics/statisticsengtotal.pug';
    if (req.query.cfield) try { str = req.query.cfield.match(re)[0]; } catch (x) { }
    if (str == '中' || str == '英' || str == '數' || str == '全') {
        var sql = "select a.classno,a.seat,a.c_name,t1,e1,total1,t2,e2,total2,t3,e3,total3,total,coursename from eschool.mrs_stud_course a inner join eschool.mrs_course_detail b on a.course_d_id=b.course_d_id " +
            " where a.course_d_id in ( " +
            " SELECT course_d_id  FROM eschool.mrs_course_detail where c_field like '%" + str + "%' and not c_T_type ='必選' and classno like 'S%' order by classno,groupid,tab) order by a.classno,a.seat,b.groupid,b.tab";
        if(str=='全' && req.query.cIDs){
            var cIDs=req.query.cIDs.match(/\d+/g);
            var sql = `select a.classno,a.seat,a.c_name,t1,e1,total1,t2,e2,total2,t3,e3,total3,total,coursename from eschool.mrs_stud_course a inner join eschool.mrs_course_detail b on a.course_d_id=b.course_d_id 
             where a.course_d_id in (` + cIDs + `) order by a.classno,a.seat,b.groupid,b.tab`;
            totalpug="markup/statistics/statisticsengtotal.1.pug";
        }
        getModel().StatisticsRead(sql, (err, entity) => {
            if (err) { next(err); return; }
            res.render(totalpug, {
                books: entity,
                cfield: str,
                profile:req.user
            });
        });
    } else {
        res.set('Content-Type', 'text/html');
        res.end(`<form method=GET>
        <table><tr><td>Type<td>
        <select name=cfield>
        <option value='中'>chn
        <option value='英'>eng
        <option value='數'>maths
        <option value='全'>chn eng maths hist geo bio phy che (course_d_id list)</select><br>
        <tr><td>Course_D_ID<td>
        <input type=text size=120 name=cIDs value="445,288,329,359,641,383,687,230,289,330,360,371,384,679,420,290,333,361,372,385,678,422,291,433,688,373,386,680"><br>
        <tr><td><td>
        <input type=submit value=submit>
        </form>`
        );
    }
});
router.get('/statisticsmarktotal', (req, res) => {
    // 總分列表(包括英文,會話)  by {中, 英, 數}
    var re = /\w+/g;
    var str = '';
    if (req.query.cfield) try { str = req.query.cfield.match(re)[0]; } catch (x) { }
    if (str == 'S' || str == 'SG' || str == 'SC' || str == 'P' || str == 'K') {
        var sess=req.query.sess;
        if(sess != "") sess = sess.match(/\d+/g)[0];   
        var sql =  `SELECT classno,seat,c_name,mark1,ran1,mark2,ran2,mark3,ran3,mark,ran,total_crs_ncp,allpass1,allpass2,allpass3 FROM eschool${sess}.mrs_stud_conduct WHERE classno like '${str}%' Order By classno, seat;`;
        getModel().StatisticsRead(sql, (err, entity) => {
            if (err) { console.log(err); return; }
            if (req.query.dt && req.query.dt == 'json') {
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify(entity));
            } else {
                res.render('markup/statistics/marktotaltabl.pug', {
                    books: entity,
                    cfield: str,
                    profile:req.user
                });
            }
        });
    }else{
        res.set('Content-Type', 'text/html');
        res.write("<form method=GET>");
        res.write("<select name=sess><option value='' default>curr");
        let sesn=['1920','1819','1718','1617','1516','1415','1314','1213','1112','1011','0910','0809','0708','0607','0506','0405','0304','0203'];
        for(let i = 0; i < sesn.length; i++){
            res.write(`<option value='${sesn[i]}'>${sesn[i]}`);
        }
        res.end("</select><select name=cfield><option value='P'>P<option value='S'>S<option value='SG'>SG<option value='SC'>SC<option value='K'>K</select><input type=submit value=submit></form>");
    }
});
router.get('/markstatisrawdatalistclass', (req, res) => {
    var sql = "SELECT classno FROM eschool.sclass where classno >'P' order by RCid;";
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
router.get('/mark_report_mrs_course_table', (req, res,next) => {
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
        //console.log(entity);
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
        e.SPK = req.user.marksys_info[1][0].spk;
        e.aoflag = mrs.p_allowOpSect;
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
    stafref:
}
*/
router.post('/InputMarkReportParam', images.multer.single('image'), (req, res) => {                
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
        //MarkDocx(req, res, e);
        if(grp.GRP_R_MARK_ADMIN(req.user)){ MarkDocx(req, res,  e); }
        else if(grp.GRP_R_Pri_OA(req.user) && e.cno.indexOf('P')>-1) { MarkDocx(req, res,  e);}
        else if(grp.GRP_R_Sec_OA(req.user) && e.cno.indexOf('S')>-1) { MarkDocx(req, res,  e);}
        else { e.cno=netutils.id2classno(req.user); if(e.cno){ MarkDocx(req, res,  e); }else{ res.end("not right!"); } }        
    } else {
        //markstatis_data(req, res,  e);
        if(grp.GRP_R_MARK_ADMIN(req.user)){ markstatis_data(req, res,  e); }
        else if(grp.GRP_R_Pri_OA(req.user) && e.cno.indexOf('P')>-1) { markstatis_data(req, res,  e);}
        else if(grp.GRP_R_Sec_OA(req.user) && e.cno.indexOf('S')>-1) { markstatis_data(req, res,  e);}
        else { e.cno=netutils.id2classno(req.user); if(e.cno){ markstatis_data(req, res,  e); }else{ res.end("not right!"); } }        
    }
});
router.get('/InputMarkNoticParam', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    let e = { pdate: fmt_now(), sess: "1819", session: "", classno: "SG1A" ,SPK:"0",aoflag:0,term:3,stafref:""};
    if (req.user && req.user.marksys_info && req.user.marksys_info[0][0]) {
        let mrs = req.user.marksys_info[0][0];
        e.sess = mrs.session_desc;
        e.session = mrs.session;
        e.classno=netutils.id2classno(req.user);
        e.SPK = req.user.marksys_info[1][0].spk;
        e.aoflag = mrs.p_allowOpSect;
        if (e.SPK==1) e.aoflag = mrs.allowOpSect;
        e.term = e.aoflag;
        if (e.aoflag == 1) { e.pdate = mrs.date1; }
        else if (e.aoflag == 2) { e.pdate = mrs.date2 }
        else { e.pdate = mrs.date3; }
    }
    res.render('markup/markreport/InputMarkNoticParam.pug', { cfg: e, profile: req.user,});
});

router.post('/InputMarkNoticParam', images.multer.single('image'), (req, res) => {         
    var regexp = /\d+/gi;
    let filter = req.body.filter == "none" ? null : req.body.filter.match(regexp);
    let e= req.body;
    e.filter=filter;
    e.cno=req.body.classno;
    if(grp.GRP_R_MARK_ADMIN(req.user)){ markstatis_data(req, res,  e); }
    else if(grp.GRP_R_Pri_OA(req.user) && e.cno.indexOf('P')>-1) { markstatis_data(req, res,  e);}
    else if(grp.GRP_R_Sec_OA(req.user) && e.cno.indexOf('S')>-1) { markstatis_data(req, res,  e);}
    else { e.cno=netutils.id2classno(req.user); if(e.cno){ markstatis_data(req, res,  e); }else{ res.end("not right!"); } }
});

router.get('/MarkNotice',  (req, res) => {    
    var regexp = /\d+/gi;
    let filter = req.query.filter == "none" ? null : req.query.filter.match(regexp);  
    let fmt=req.query.term==4 ? "mfmfinal":"mfmttermp";    
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
        aoflag:3,
        stafref:""
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

function MarkDocxml(request, respone, e) {
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
            //console.log(rawData);
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
function MarkDocx(request, respone, e) {
    let exportfilename = e.cno + ".docx";
    let param_postData = querystring.stringify(e);
    let options = {
        hostname: '127.0.0.1', port: 8082, path: '/MRSCLASSMARKSCORETABDOCXX?' + Math.random(), method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8'); let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            //console.log(rawData);
            let filename = rawData;//.toString().replace(/\W+/, '');
            try {

                if (fs.existsSync(filename)) {
                    respone.setHeader("Content-type", "application/vnd.ms-word");
                    respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(exportfilename) + ";");
                    let gzip_flag=true;
                    if(!gzip_flag){
                        let stream=fs.createReadStream(filename);
                        try{
                        stream.pipe(respone);
                        stream.on('error', err => console.log(err));
                        }finally{
                            stream.end();
                        }

                    }else{
                        let raw = fs.createReadStream(filename);
                        try{
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
                        raw.on('error', err => console.log(err));
                        }finally{
                           //raw.end();
                           raw.resume();
                        }
                    }
                } else {
                    respone.writeHead(404, { 'Content-Type': 'text/html' });
                    return respone.end("<div style='position: absolute;top:50%;left:50%'>404 Not Found</div>");
                }
            } catch (err) { console.log(err); }
        });
    });
    req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    req.write(param_postData);
    req.end();
}
function markstatis_data_(request, respone, fmt){
/*  public class MrsMarkFormInput
    {
        public String cno { set; get; }
        public String sess { set; get; }
        public String session { set; get; }
        public String term { set; get; }
        public String pdate { set; get; }
        public String calcopt { set; get; }
        public String filter { set; get; }
        public String mg { set; get; }
        public String SPK { set; get; }  //user for 1,2,4
        public String aoflag { set; get; }
        public String fmt { set; get; }//mfmttermp/docx/xls/json
        public String update_PubDate { set; get; }             // update_PubDate / none
        public string stafref { set; get; }
    }
       public String cno { set; get; }
        public String sess { set; get; }
        public String session { set; get; }
        public String term { set; get; }
        public String pdate { set; get; }
        public String calcopt { set; get; }
        public String filter { set; get; }
        public String mg { set; get; }
        public String SPK { set; get; }  //user for 1,2,4
        public String aoflag { set; get; }
        public String fmt { set; get; }//mfmttermp/docx/xls/json
        public String update_PubDate { set; get; }             // update_PubDate / none
        public string stafref { set; get; }
*/
    let cno_=request.params.book;
    let data={
        fn : cno_ + ".xls",
        cno : cno_.toUpperCase(),
        classno: cno_.toUpperCase(),
        term : request.query.term?request.query.term:3,
        pdate : netutils.id2pdate(request.user, request.query.term),
        session : netutils.id2session(request.user),
        sess : netutils.id2sessiondesc(request.user),
        filter :  "none",
        fmt: fmt,     
        mg:"m",
        update_PubDate:"none",
        calcopt:"calc",
        SPK:1,
        aoflag:3,
        stafref:""
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
    console.log(data);
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
                        //console.log(process.cwd());
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
        aoflag:3,
        stafref:""
    };         
    markstatis_data(req, res,  e);	
});
router.get('/markstatisrawdata/:book/finalreport', (request, respone, next) => {
    markstatis_data_(request, respone, "finalreport");
});
const { finished } = require('stream');
function exportxlsfile(acceptEncoding,respone,exportfilename,filename){
    try {
        if (fs.existsSync(filename)) {
            respone.setHeader("Content-type", "application/vnd.ms-excel");
            respone.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(exportfilename) + ";");
            let gzip_flag=false;
            //if(!gzip_flag){
                let raw=fs.createReadStream(filename)
                try{
                  raw.pipe(respone);
                }finally{
                  //raw.end();
                  raw.resume(); // Drain the stream.
                }
                
            /*}else{
                let raw = fs.createReadStream(filename);
                //let acceptEncoding = request.headers['accept-encoding'];
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
            }*/
        } else {
            respone.writeHead(404, { 'Content-Type': 'text/html' });
            return respone.end("404 Not Found");
        }
    } catch (err) { console.log(err); }
}
router.get('/markcrsxls/:book', (request, respone, next) => {
    if(request.user){
        let e= {crsid:request.params.book,stafref:request.user.id};
        GenMrsExpXls(request, respone,`/api/MrsExpXls/crs/${e.crsid}?stafref=${e.stafref}`);
    }
});
router.get('/marksummaryxls/:book', (request, respone, next) => {
    if(request.user){
        let e= {crsid:request.params.book,stafref:request.user.id,term:request.query.term};
        GenMrsExpXls(request, respone,`/api/MrsExpXls/summary/${e.crsid}?stafref=${e.stafref}&term=${e.term}`);
    }
});
router.get('/markcommentxls/:book', (request, respone, next) => {
    if(request.user){
        let e= {crsid:request.params.book,stafref:""+request.user.id};
        GenMrsExpXls(request, respone,`/api/MrsExpXls/comment/${e.crsid}?stafref=${e.stafref}`);
    }
});
router.get('/markconductxls/:book', (request, respone, next) => {
    if(request.user){
        let e= {crsid:request.params.book,stafref:""+request.user.id};
        console.log(e);
        GenMrsExpXls(request, respone,`/api/MrsExpXls/conduct/${e.crsid}?stafref=${e.stafref}`);
    }
});
router.get('/markcommentconductxlsSelectorPSTAF', (request, respone, next) => {
    if(request.user){
        let e= {crsid:request.query.classno,term:request.query.term,stafref:""+request.user.id};
        GenMrsExpXls(request, respone,`/api/MrsExpXls/commentconduct/${e.crsid}?stafref=${e.stafref}&term=${e.term}`);
    }
});
function GenMrsExpXls(request,respone, urlpath ){  //e.crsid e.stafref http://localhost:8082/api/MrsExpXls/crs/5?stafref=2002024
    let options = {
        hostname: '127.0.0.1', port: 8082, path: urlpath, method: 'GET', //headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8'); let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => { 

            try{
            let data=JSON.parse(rawData);
            if (data[1]=="null")
            {
                respone.end(rawData);
            }else{
                let filename=data[1];
                let temp=filename.split('\\');
                let exportfilename=temp[temp.length-1];
                let acceptEncoding = request.headers['accept-encoding'];
                exportxlsfile(acceptEncoding,respone,exportfilename,filename);
            }
           }catch(err){
               console.error(err);
           }
        });
        req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    });
    req.end();
}
router.get('/markstatisxlsSelectorPSTAF', (req, res, next) => {
    let classno=req.query.classno;
    let term=req.query.term;
    if(grp.GRP_R_Pri_OA(req.user)||grp.GRP_R_Sec_OA(req.user)){
      res.redirect(`/internal/markup/markstatisxls/${classno}?term=${term}`);
    }
});
  
router.get('/markstatisxls/:book', (req, respone, next) => {
    let term=4;
    let cno=req.params.book.toUpperCase();
    if(req.query.term) term= req.query.term ;    
    if(req.user){
        let data={
            cno : cno,
            sess : "",
            session : "",
            //classno: cno,
            term : term,
            pdate : "",
            calcopt:"calc",
            filter :  "none",
            mg:""+req.user.id,
            SPK:"1",
            aoflag:"3",
            fmt: "xls",     
            update_PubDate:"none",
            stafref:""+req.user.id
        };
        GenStatisXls(req, respone, data);
    }
});

function GenStatisXls(request,respone, e){
    //e.crsid e.stafref http://localhost:8082/api/MrsExpXls/crs/5?stafref=2002024
    let param_postData = querystring.stringify(e);
    let options = {
        hostname: '127.0.0.1', port: 8082, path:  '/MRSCLASSMARKTOTALTABXLS0?r='+Math.random(), method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(param_postData) }
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf8'); let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => { 
            let filename=rawData;
            if(filename=="null"){return filename;}
            else{
              let temp=filename.split('\\');
              let exportfilename=temp[temp.length-1];
              let acceptEncoding = request.headers['accept-encoding'];
              exportxlsfile(acceptEncoding,respone,exportfilename,filename);
            }
            /*
            let data=JSON.parse(rawData);if (data[1]=="null") { respone.end(rawData);}else{ let filename=data[1];let temp=filename.split('\\');let exportfilename=temp[temp.length-1];}
            */
        });
        req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
    });
    req.write(param_postData);
    req.end();
}

//
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});
module.exports = router;
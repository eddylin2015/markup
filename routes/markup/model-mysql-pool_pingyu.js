// attend

'use strict';
const mysql = require('mysql');
const mysqlcfg = require('../mysql250/mysql250config');

const pool = mysqlcfg.esdbPool;

function StatisticsRead(sql, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            sql,
            [],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, results);
                connection.release();
            });
    });
}

function DataReaderQuery(sql, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            sql,
            [],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, results);
                connection.release();
            });
    });
}

function readpingyu(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            "select stud_ref,classno,seat,c_name,GROUP_CONCAT(pingyu1 ORDER BY Lineno SEPARATOR '') as py1,GROUP_CONCAT(pingyu2 ORDER BY Lineno SEPARATOR '') as py2,GROUP_CONCAT(pingyu3 ORDER BY Lineno SEPARATOR '') as py3 from mrs_pingyu where classno=? group by stud_ref order by seat;",
            //'SELECT * FROM `mrs_pingyu` WHERE `classno` = ? ',
            id, (err, results) => {
                /*if (!err && !results.length) { err = {code: 404,   message: 'Not found'};                }*/
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function pm2g(m) {
    return m >= 95 ? "A " : m >= 90 ? "A-" : m >= 85 ? "B+" : m >= 80 ? "B " : m >= 75 ? "B-" : m >= 70 ? "C+" : m >= 65 ? "C " : m >= 60 ? "C-" : "D "
}

function ReadMarksysAuth(staf_ref, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_session_def` where `curr_flag` = 1;' +
            'SELECT UserID,UserName,RoleID,staf_ref,classno,SPK FROM `es_user` where `staf_ref` = ?;' +
            'SELECT * FROM `mrs_course_detail` WHERE `staf_ref` = ? ; ' +
            'SELECT * FROM `mrs_course_detail` WHERE `classno` in (select classno from es_user where staf_ref= ? ) ',
            [staf_ref, staf_ref, staf_ref], (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

//Course Sub ITEM END..
function readclassnostud(id, cb) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'SELECT stud_ref,curr_class,curr_seat,c_name,e_name FROM  studinfo  where curr_class= ? ', id, (err, res) => {
                if (!err && !res.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

async function UpdatePingYu( aot, myclass,aObj, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        if (aObj) {
            let alist = Object.keys(aObj);
            for (let i = 0; i < alist.length; i++) {
                let ar_ = alist[i].split('_');
                let studref=ar_[2];
                let fieldname=ar_[1];
                let pyStmt = aObj[alist[i]];
                if(aot==1 && fieldname=="pingyu1" ){}
                else if(aot==2 && fieldname=="pingyu2" ){}
                else if(aot==3 && fieldname=="pingyu3" ){}
                else{continue;}
                //console.log(aot,fieldname,pyStmt,studref)
                cnt += await new Promise((resolve, reject) => {
                    connection.query(`update mrs_pingyu set ${fieldname}=? where classno=? and lineno=0 and stud_ref=?`, [pyStmt,myclass,studref], (err, res) => {
                        if (err) { console.log(err); reject(err); }
                        resolve(100);
                    });
                });
            }
        }
        cb(null, Math.floor(cnt / 100));
        connection.release();
    });
}
async function UpdatePingYuArr( aot, myclass,alist, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        if (alist) {
            for (let i = 0; i < alist.length; i++) {
                let ar_ = alist[i];
                if(ar_.length<9 ) continue;
                let studref=ar_[0];
                let fieldname=null;
                let pyStmt = null;
                if(aot==1){fieldname="pingyu1";pyStmt = ar_[6];} 
                if(aot==2){fieldname="pingyu2";pyStmt = ar_[7];} 
                if(aot==3){fieldname="pingyu3";pyStmt = ar_[8];} 
                if(fieldname==null){continue;}
                cnt += await new Promise((resolve, reject) => {
                    connection.query(`update mrs_pingyu set ${fieldname}=? where classno=? and lineno=0 and stud_ref=?`, [pyStmt,myclass,studref], (err, res) => {
                        if (err) { console.log(err); reject(err); }
                        resolve(100);
                    });
                });
            }
        }
        cb(null, Math.floor(cnt / 100));
        connection.release();
    });
}
//Reg Stud Pingyu 
//Reg Stud Course 
function ReadClassStudPingyu(ccno, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            [" select LineNo as id,a.stud_ref,a.curr_seat,a.c_name ",
            " from ",
            "  ( select stud_ref,curr_seat,c_name from  studinfo where curr_class=?) as a",
            "left join",
            "( select LineNo,stud_ref,seat,c_name from  mrs_pingyu where classno=?) as b",
            " on a.stud_ref=b.stud_ref",
            "order by curr_seat"].join(" "),
            [ccno,ccno], (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}
async function RegStudPingyu(sid, cno, aObj, rObj, cb) {
    pool.getConnection(async function (err, connection) {
        console.log(cno)
        if (err) { cb(err); return; }
        let cnt = 0;
        if (aObj) {
            let alist = Object.keys(aObj);
            for (let i = 0; i < alist.length; i++) {
                let studref = alist[i];
                let li = aObj[studref].split(':');               
                let seat = li[0];
                let name = li[1];
                let data = { session_id:sid,stud_ref: studref, classno: cno, seat: seat, c_name: name,lineno:0 }
                cnt += await new Promise((resolve, reject) => {
                    connection.query('INSERT INTO `mrs_pingyu` SET ?', data, (err, res) => {
                        if (err) { console.log(err); reject(err); }
                        resolve(100);
                    });
                });
            }
        }
        if (rObj) {
            let rlist = Object.keys(rObj);
            for (let i = 0; i < rlist.length; i++) {
                let studref = rlist[i];
                let li = rObj[studref].split(':');
                let seat = li[0];
                let name = li[1];
                let scid = li[2];
                cnt += await new Promise((resolve, reject) => {
                    connection.query("delete from mrs_pingyu where pingyu1=' ' and  stud_ref= ? and session_id=? ", [studref,sid], (err, res) => {
                        if (err) { console.log(err); reject(err); }
                        resolve(100);
                    });
                });
            }
        }
        cb(null, Math.floor(cnt / 100));
        connection.release();
    });
}
module.exports = {
    createSchema: createSchema,
    readpingyu: readpingyu,
    ReadMarksysAuth: ReadMarksysAuth,
    StatisticsRead: StatisticsRead,
    DataReaderQuery: DataReaderQuery,
    readclassnostud: readclassnostud,
    UpdatePingYu:UpdatePingYu,
    UpdatePingYuArr:UpdatePingYuArr,
    ReadClassStudPingyu:ReadClassStudPingyu,
    RegStudPingyu:RegStudPingyu,
};

if (module === require.main) {
    const prompt = require('prompt');
    prompt.start();

    console.log(
        `Running this script directly will allow you to initialize your mysql
    database.\n This script will not modify any existing tables.\n`);

    prompt.get(['user', 'password'], (err, result) => {
        if (err) {
            return;
        }
        createSchema(result);
    });
}

function createSchema(config) {
    /*
    const connection = mysql.createConnection(extend({
        multipleStatements: true
    }, config));

    connection.query(
   `CREATE DATABASE IF NOT EXISTS \`deptwork\`
    DEFAULT CHARACTER SET = 'utf8'
    DEFAULT COLLATE 'utf8_general_ci';
    USE \`deptwork\`;
    CREATE TABLE IF NOT EXISTS \`deptwork\`.\`watchguard\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`stime\` VARCHAR(255) NULL,
      \`etime\` VARCHAR(255) NULL,
      \`incoming\` VARCHAR(255) NULL,
      \`outgoing\` VARCHAR(255) NULL,
      \`reccnt\` VARCHAR(255) NULL,
    PRIMARY KEY (\`stime\`));`,
        (err) => {
            if (err) {
                throw err;
            }
            console.log('Successfully created schema');
            connection.end();
        }
    );*/
}
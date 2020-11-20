// mrs_stud_grade_course
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

function readgrademark(staf_ref, id, cno , cb) {
    let sql = 'SELECT * FROM `mrs_stud_grade_course` WHERE `classno` = ? ';
    if (id.indexOf('P') == 0 || id.indexOf('S') == 0) { }
    else { sql = 'SELECT * FROM `mrs_stud_grade_course` WHERE `GC_Name` = ? '; }
    if(cno){
        if(cno=='P4') sql +=" and classno like 'P4%'";
        if(cno=='P56') sql +=" and classno > 'P5'";
    }
    sql+=" order by classno,seat ";
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            sql, id, (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function pm2g(m) {
    return m >= 95 ? "A " : m >= 90 ? "A-" : m >= 85 ? "B+" : m >= 80 ? "B " : m >= 75 ? "B-" : m >= 70 ? "C+" : m >= 65 ? "C " : m >= 60 ? "C-" : "D "
}

/*2019 不執行輸入分數
if (fieldn.indexOf("mgrade") > -1) {
    let f1 = fieldn.replace("mgrade", "grade");
    let res = v.match(/^\d+[.\d+]*$/);
    if (res) {
        sql = `UPDATE mrs_stud_grade_course SET ${f1}=?, ${fieldn}= ? WHERE sgcid =?  `;
        let grade = pm2g(Number(res));
        v_arr = [grade, v, k];
    }
}*/

async function savegrademark(aot, json, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let arrkeys = Object.keys(json);
        let cnt = 0;
        for (let i = 0; i < arrkeys.length; i++) {
            let x = arrkeys[i];
            let v = json[x];
            let a = x.split("_");
            let k = a[2];  //MB_grade{1}_{sgcid}
            let fieldn = a[1].replace("-", "_");
            let sql = 'UPDATE `mrs_stud_grade_course` SET ' + fieldn + '= ? WHERE `sgcid` =?  ';
            let v_arr = [v, k];
            cnt += await new Promise((resolve, reject) => {
                connection.query(sql, v_arr, (err, res) => {
                    if (err) { console.log(err); reject(err); }
                    resolve(100);
                });
            });
        }
        cb(null, cnt/100);
        connection.release();
    });
}

async function savegrademarkarray(fieldn, data, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        let STUD_REF_index = 0;
        let GC_NAME_index = 0;
        let GRADE_index = 0;
        if (data.length > 0 && data[0][0].toUpperCase() == "STUD_REF") {
            for (let i = 0; i < data[0].length; i++) {
                if (!data[0][i]) continue;
                if (data[0][i].toUpperCase().indexOf("STUD_REF") > -1) { STUD_REF_index = i; }
                if (data[0][i].toUpperCase().indexOf("GC_NAME") > -1) { GC_NAME_index = i; }
                if (data[0][i].toUpperCase().indexOf(fieldn.toUpperCase()) > -1) { GRADE_index = i; }
            }
        }
        if (!(GC_NAME_index > 0 && GRADE_index > 0)) cb("error format!");
        for (let i = 0; i < data.length; i++) {
            if (data[i][0] == "stud_ref" || data[i][0] == "STUD_REF") continue;
            let studref = data[i][STUD_REF_index];
            let gcname = data[i][GC_NAME_index];
            let grade = data[i][GRADE_index] ? data[i][GRADE_index] : '';     //.substring(0,2)
            let mgrade = 0;
            let numpatt = /^\d+[.\d+]*$/;
            let res = grade.match(numpatt);
            if (res) {
                mgrade = Number(res);
                grade = pm2g(mgrade);
            }
            let sql = 'UPDATE `mrs_stud_grade_course` SET gc_name= ? ,' + fieldn + '= ?,m' + fieldn + '= ? WHERE `stud_ref` = ? ; ';
            cnt += await new Promise((resolve, reject) => {
                connection.query(sql, [gcname, grade, mgrade, studref], (err, res) => {
                    if (err) { console.log(err); reject(err); }
                    resolve(100);
                });
            });
        }
        cb(null, cnt/100);
        connection.release();        
    });
}

function updateGCNameCMD(connection, sql, gcname, studref) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, [gcname, studref], (err, result) => {
            if (err) { console.log(err); reject(err); }
            resolve(100 + result.affectedRows);
        });
    });
}
async function updateGCNameArray(GCName, data, rlist, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        if (data)
            for (let i = 0; i < data.length; i++) {
                let li = data[i].split('_');
                let studref = li[0];
                let gcname = GCName;
                let sql = 'UPDATE `mrs_stud_grade_course` SET gc_name= ?  WHERE `stud_ref` = ? ; ';
                cnt += await updateGCNameCMD(connection, sql, gcname, studref);
            }
        if (rlist)
            for (let i = 0; i < rlist.length; i++) {
                let studref = rlist[i];
                let gcname = "";
                let sql = 'UPDATE `mrs_stud_grade_course` SET gc_name= ?  WHERE `stud_ref` = ? ; ';
                cnt += await updateGCNameCMD(connection, sql, gcname, studref);
            }
        cb(null, Math.floor(cnt / 100));
        connection.release();
    });
}

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
//Reg Stud Grade Course 
function ReadStudGradeCourse(cno, cb) {
    pool.getConnection(function (err, connection) {
        let pcno = ` where classno = '${cno}' `;
        if (cno == 'P4') pcno = " where classno in ('P4A','P4B','P4C') ";
        else if (cno == 'P13') pcno = " where classno <'P4' ";
        else if (cno == 'P56') pcno = " where classno >= 'P5' ";
        connection.query(
            [" select sgcid as id,stud_ref,classno,seat,c_name,gc_name ",
                " from mrs_stud_grade_course",
                pcno,
                "order by classno, seat"].join(" "),
            [], (err, res) => {
                if (!err && !res.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

function ReadClassStudGradeCourse(cno, cb) {
    pool.getConnection(function (err, connection) {
        connection.query(
            [" select sgcid as id,a.stud_ref,a.curr_seat,a.c_name,GC_Name ",
                " from ",
                "  ( select stud_ref,curr_seat,c_name from  studinfo where curr_class=?) as a",
                "left join",
                "( select sgcid,stud_ref,seat,c_name,GC_Name from  mrs_stud_grade_course where classno=?) as b",
                " on a.stud_ref=b.stud_ref",
                "order by curr_seat"].join(" "),
            [cno, cno], (err, res) => {
                if (!err && !res.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

async function AddStudGradeCourseRow(cno, aObj, rObj, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        if (aObj) {
            let alist = Object.keys(aObj);
            for (let i = 0; i < alist.length; i++) {
                let studref = alist[i];
                let li = aObj[studref].split(':');
                let seat = li[0];
                let name = li[1];
                let data = { stud_ref: studref, classno: cno, seat: seat, c_name: name }
                cnt += await new Promise((resolve, reject) => {
                    connection.query('INSERT INTO `mrs_stud_grade_course` SET ?', data, (err, res) => {
                        if (err) { console.log(err); reject(err); }
                        resolve(100);
                    });
                });
            }
        }
        if (rlist) {
            let rlist = Object.keys(rObj);
            for (let i = 0; i < rlist.length; i++) {
                let studref = alist[i];
                let li = aObj[studref].split(':');
                let seat = li[0];
                let name = li[1];
                let sgcid = li[2];
            }
        }
        cb(null, Math.floor(cnt / 100));
        connection.release();
    });
}

//Reg Stud Grade Course 

module.exports = {
    createSchema: createSchema,
    readgrademark: readgrademark,
    savegrademark: savegrademark,
    savegrademarkarray: savegrademarkarray,
    updateGCNameArray: updateGCNameArray,
    StatisticsRead: StatisticsRead,
    DataReaderQuery: DataReaderQuery,
    readclassnostud: readclassnostud,
    ReadStudGradeCourse: ReadStudGradeCourse,
    ReadClassStudGradeCourse: ReadClassStudGradeCourse,
    AddStudGradeCourseRow: AddStudGradeCourseRow,
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
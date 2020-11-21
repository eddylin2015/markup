﻿// attend

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

function readstudcourse(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'SELECT * FROM `mrs_stud_course` WHERE `course_d_id` = ? order by seat', id, (err, results) => {
                /*if (!err && !results.length) { err = { code: 404, message: 'Not found' }; }*/
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

function read(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_stud_course` WHERE `course_d_id` = ? ', id, (err, results) => {
                if (!err && !results.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, results[0]);
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

//Reg Stud Course Mark

async function UpdateMark( aot,myclass, aObj, cb) {
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
                if(aot==1 && fieldname=="conduct1" ){}
                else if(aot==2 && fieldname=="conduct1" ){}
                else if(aot==3 && fieldname=="conduct1" ){}
                else{continue;}
                //console.log(aot,fieldname,pyStmt,studref)
                cnt += await new Promise((resolve, reject) => {
                    connection.query(`update mrs_stud_course set ${fieldname}=? where classno=? and stud_ref=?`, [pyStmt,myclass,studref], (err, res) => {
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
async function UpdateMarkArr( aot,myclass, alist, cb) {
    pool.getConnection(async function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        if (alist) {
            for (let i = 0; i < alist.length; i++) {
                let ar_ = alist[i];
                if(ar_.length<9 ) continue;
                let studref=ar_[0];
                let fieldname=null;
                let Val = null;
                if(aot==1){fieldname="1";Val = ar_[9];} 
                if(aot==2){fieldname="conduct2";Val = ar_[17];} 
                if(aot==3){fieldname="conduct3";Val = ar_[25];} 
                if(fieldname==null){continue;}
                //console.log(aot,fieldname,pyStmt,studref)
                cnt += await new Promise((resolve, reject) => {
                    connection.query(`update mrs_stud_course set ${fieldname}=? where classno=? and stud_ref=?`, [Val,myclass,studref], (err, res) => {
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
    readstudcourse: readstudcourse,
    UpdateMarkArr: UpdateMarkArr,
    UpdateMark:UpdateMark,
    ReadMarksysAuth: ReadMarksysAuth,
    StatisticsRead: StatisticsRead,
    DataReaderQuery: DataReaderQuery,
    read: read,
    readclassnostud: readclassnostud,
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
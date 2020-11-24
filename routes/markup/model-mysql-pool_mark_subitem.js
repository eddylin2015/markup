'use strict';

const mysql = require('mysql');
const mysqlcfg = require('../mysql250/mysql250config');
const pool = mysqlcfg.esdbPool;

function listCourseBy(staf_ref, userid, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail` Where `staf_ref`=?  LIMIT ? OFFSET ?',
            [staf_ref, limit, token], (err, results) => {
                if (err) { cb(err); return; }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();

            });
    });
}

function StatisticsRead(sql, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            sql, [], (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function DataReaderQuery(sql, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            sql, [], (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function readstudcourse(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_stud_course` WHERE `course_d_id` = ? order by seat', id, (err, results) => {
                if (err) { cb(err); return; }
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
            id, (err, results) => {
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function readconduct(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_stud_conduct` WHERE `classno` = ? order by seat ', id, (err, results) => {
                if (err) { cb(err); return; }
                //if (!err && ! results.length) { err = { code: 404, message: 'Not found' }; }
                cb(null, results);
                connection.release();
            });
    });
}

function readgrademark(staf_ref, id, cb) {
    let sql = 'SELECT * FROM `mrs_stud_grade_course` WHERE `classno` = ? ';
    if (id.indexOf('P') == 0 || id.indexOf('S') == 0) { }
    else { sql = 'SELECT * FROM `mrs_stud_grade_course` WHERE `GC_Name` = ? '; }
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

function RegObserver(staf_ref, userid, csid, obsid, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            `UPDATE mrs_course_detail SET observer${obsid}=? WHERE course_d_id=? and staf_ref =?  `, [userid, csid, staf_ref], (err, results) => {
                if (err) { console.log(err); return; }
                cb(null, results.affectedRows);
                connection.release();
            });
    });
}
function updateGradeMark(connection, sql, v_arr) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, v_arr, (err, result) => {
            if (err) { console.log(err); reject(err); }
            resolve(100 + result.affectedRows);
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

//Course Sub ITEM BEGIN..
function listcoursesubitem(staf, cdid, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail_subitem` WHERE staf_ref = ? and `course_d_id` = ? ', [staf, cdid], (err, results) => {
                if (!err && !results.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function addcoursesubitem(data, cb) {
    pool.getConnection(function (err, connection) {
        connection.query('INSERT INTO `mrs_course_detail_subitem` SET ?', data, (err, res) => {
            console.log(err, res);
            if (err) { cb(err); return; }
            readcoursesubitem(res.insertId, cb);
            connection.release();
        });
    });
}

function savecoursesubitem(data, cb) {
    pool.getConnection(function (err, connection) {
        connection.query('update `mrs_course_detail_subitem` set subitem=?, marktype=?, regdate=? where c_sid= ?',
            [data.subitem, data.marktype, data.regdate, data.c_sid], (err, res) => {
                if (err) { cb(err); return; }
                readcoursesubitem(data.c_sid, cb);
                connection.release();
            });
    });
}

function readcoursesubitem(id, cb) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'SELECT * FROM  mrs_course_detail_subitem  where c_sid= ? ', id, (err, res) => {
                if (!err && !res.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

function updateCoursesubitemDataJson(csid, cdid, DataJson, cb) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'UPDATE mrs_course_detail_subitem set DataJson=?  where c_sid= ? ', [DataJson, csid], (err, res) => {
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

function ObserveListCourseSubitemByStaf(staf, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail_subitem` WHERE staf_ref = ? ', [staf], (err, results) => {
                if (!err && !results.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function ObserveListCourseSubitemBySCID(staf, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail_subitem` WHERE course_d_id = ? ', [staf], (err, results) => {
                if (!err && !results.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function listObserveListSCID(staf, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail` WHERE observer1 = ? or observer2 =  ? ', [staf, staf], (err, results) => {
                if (!err && !results.length) { err = { code: 404, message: 'Not found' }; }
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
                if (!err && !res.length) { err = { code: 404, message: 'Not found' }; }
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}

module.exports = {
    createSchema: createSchema,
    listCourseBy: listCourseBy,
    readstudcourse: readstudcourse,
    readpingyu: readpingyu,
    readconduct: readconduct,
    readgrademark: readgrademark,
    ReadMarksysAuth: ReadMarksysAuth,
    StatisticsRead: StatisticsRead,
    DataReaderQuery: DataReaderQuery,
    read: read,
    listcoursesubitem: listcoursesubitem,
    addcoursesubitem: addcoursesubitem,
    readcoursesubitem: readcoursesubitem,
    readclassnostud: readclassnostud,
    updateCoursesubitemDataJson: updateCoursesubitemDataJson,
    savecoursesubitem: savecoursesubitem,
    ObserveListCourseSubitemByStaf: ObserveListCourseSubitemByStaf,
    ObserveListCourseSubitemBySCID: ObserveListCourseSubitemBySCID,
    RegObserver: RegObserver,
    listObserveListSCID: listObserveListSCID,
};

if (module === require.main) {
    const prompt = require('prompt');
    prompt.start();
    console.log(
        `Running this script directly will allow you to initialize your mysql database.\n This script will not modify any existing tables.\n`);
    prompt.get(['user', 'password'], (err, result) => {
        if (err) { return; }
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
// attend

'use strict';
const mysql = require('mysql');
const mysqlcfg = require('../mysql250/mysql250config');

const pool = mysqlcfg.esdbPool;
function list(userId, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `ans` order by datet DESC ', [],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, results);
                connection.release();
            }
        );
    });
}
function listMore(limit, datestr, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'SELECT *  FROM `ans` order by datet DESC LIMIT ? OFFSET ?', //, DAYOFWEEK(logDate)-1 dw
            [limit, token],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();

            });
    });
}
function listBy(limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'SELECT * FROM `watchguard`  LIMIT ? OFFSET ?',
            [limit, token],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();

            });
    });
}

function listCourseBy(staf_ref, userid, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'SELECT * FROM `mrs_course_detail` Where `staf_ref`=?  LIMIT ? OFFSET ?',
            [staf_ref, limit, token],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();

            });
    });
}
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

function create(data, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query('INSERT INTO `watchguard` SET ?  ON DUPLICATE KEY UPDATE incoming=? ,outgoing=?, reccnt=? ', [data, data.incoming, data.outgoing, data.reccnt], (err, res) => {
            if (err) {
                cb(err);
                return;
            }
            //read(res.insertId, cb);
            cb(null);
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
function readconduct(staf_ref, id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'SELECT * FROM `mrs_stud_conduct` WHERE `classno` = ? order by seat ', id, (err, results) => {
                //if (!err && ! results.length) { err = { code: 404, message: 'Not found' }; }
                if (err) { cb(err); return; }
                cb(null, results);
                connection.release();
            });
    });
}

function readgrademark(staf_ref, id, cb) {
    let sql='SELECT * FROM `mrs_stud_grade_course` WHERE `classno` = ? ';
    if( id.indexOf('P')==0 ||id.indexOf('S')==0){}
    else{sql='SELECT * FROM `mrs_stud_grade_course` WHERE `GC_Name` = ? ';}
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

function RegObserver(staf_ref,userid,csid,obsid,cb){
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        //SELECT * FROM eschool.mrs_course_detail;
        connection.query(
            `UPDATE mrs_course_detail SET observer${obsid}=? WHERE course_d_id=? and staf_ref =?  `, [userid,csid,staf_ref], (err,results) => {   
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
/*
get('story.json').then(function(response) {
  return JSON.parse(response);
}).then(function(response) {
  console.log("Yey JSON!", response);
})
*/
function pm2g(m) {
    return m >= 95 ? "A " : m >= 90 ? "A-" : m >= 85 ? "B+" : m >= 80 ? "B " : m >= 75 ? "B-" : m >= 70 ? "C+" : m >= 65 ? "C " : m >= 60 ? "C-" : "D "
}
function savegrademark(staf_ref, json, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        let arrkeys = Object.keys(json);
        let cnt = 0;
        for (let i = 0; i < arrkeys.length; i++) {
            let x = arrkeys[i];
            let v = json[x];
            let a = x.split("_");
            let k = a[2];
            let fieldn = a[1].replace("-", "_");

            let sql = 'UPDATE `mrs_stud_grade_course` SET ' + fieldn + '= ? WHERE `sgcid` =?  ';
            let v_arr = [v, k];
            if (fieldn.indexOf("mgrade") > -1) {
                let f1 = fieldn.replace("mgrade", "grade");
                let res = v.match(/^\d+[.\d+]*$/);
                if (res) {
                    sql = `UPDATE mrs_stud_grade_course SET ${f1}=?, ${fieldn}= ? WHERE sgcid =?  `;
                    let grade = pm2g(Number(res));
                    v_arr = [grade, v, k];
                }
            }

            updateGradeMark(connection, sql, v_arr).then(function (response) {
                cnt += response;
                if ((i + 1) == arrkeys.length) {
                    cb(null, cnt);
                    connection.release();
                }
            });
        }
    });
}


function updateGradeMarkarray(connection, sql, gcname, grade, mgrade, studref) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, [gcname, grade, mgrade, studref], (err, result) => {
            if (err) { console.log(err); reject(err); }
            resolve(100 + result.affectedRows);
        });
    });
}
function savegrademarkarray(fieldn, data, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        let STUD_REF_index = 0;
        let GC_NAME_index = 0;
        let GRADE_index = 0;
        if (data.length > 0 && data[0][0].toUpperCase() == "STUD_REF") {
            for (let i = 0; i < data[0].length; i++) {
                if (!data[0][i]) continue;
                if (data[0][i].toUpperCase().indexOf("STUD_REF")>-1) { STUD_REF_index = i; }
                if (data[0][i].toUpperCase().indexOf("GC_NAME")>-1) { GC_NAME_index = i; }
                if (data[0][i].toUpperCase().indexOf(fieldn.toUpperCase())>-1) { GRADE_index = i; }
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
            updateGradeMarkarray(connection, sql, gcname, grade, mgrade, studref).then(function (response) {
                cnt += response;
                if ((i + 1) == data.length) {
                    cb(null, Math.floor(cnt / 100));
                    connection.release();
                }
            });
        }
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
function updateGCNameArray(GCName, data, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        let cnt = 0;
        for (let i = 0; i < data.length; i++) {
            let li=data[i].split('_');
            let studref = li[0];
            let gcname = GCName;
            let sql = 'UPDATE `mrs_stud_grade_course` SET gc_name= ?  WHERE `stud_ref` = ? ; ';
            updateGCNameCMD(connection, sql, gcname, studref).then(function (response) {
                cnt += response;
                if ((i + 1) == data.length) {
                    cb(null, Math.floor(cnt / 100));
                    connection.release();
                }
            });
        }
    });
}
function updateMrkPubDate(data) {
    pool.getConnection(function (err, connection) {
        if (err) {
            cb(err);
            return;
        }
        connection.query(
            'UPDATE `mrs_session_def` SET ? WHERE `curr_flag` =1  ', [data], (err) => {   //and `createdById` = ?
                if (err) { console.log(err); return; }
                connection.release();
            });
    });
}
function updateMrsMrkSavaJson(data, checkstr) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'UPDATE `mrs_session_def` SET ? WHERE `curr_flag` =1  ', [data], (err) => {   //and `createdById` = ?
                if (err) { console.log(err); return; }
                connection.release();
            });
    });
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
function update(id, data, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'UPDATE `watchguard` SET ? WHERE `stime` = ?  ', [data, id], (err) => {   //and `createdById` = ?
                if (err) { cb(err); return; }
                read(id, cb);
                connection.release();
            });
    });
}

function _delete(id, cb) {
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query('DELETE FROM `watchguard` WHERE `stime` = ? ', [id], cb);
        connection.release();
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
            if (err) {
                cb(err);
                return;
            }
            readcoursesubitem(res.insertId, cb);
            connection.release();
        });
    });
}
function savecoursesubitem(data, cb) {
    pool.getConnection(function (err, connection) {
        connection.query('update `mrs_course_detail_subitem` set subitem=?, marktype=?, regdate=? where c_sid= ?',
            [data.subitem, data.marktype, data.regdate, data.c_sid], (err, res) => {
                if (err) {
                    cb(err);
                    return;
                }
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
            'UPDATE   mrs_course_detail_subitem set DataJson=?  where c_sid= ? ', [DataJson, csid], (err, res) => {
                if (err) { cb(err); return; }
                cb(null, res);
                connection.release();
            });
    });
}
function ObserveListCourseSubitemByStaf(staf,  cb) {
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
function ObserveListCourseSubitemBySCID(staf,  cb) {
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

function listObserveListSCID(staf,cb){
    pool.getConnection(function (err, connection) {
        if (err) { cb(err); return; }
        connection.query(
            'SELECT * FROM `mrs_course_detail` WHERE observer1 = ? or observer2 =  ? ', [staf,staf], (err, results) => {
                if (!err && !results.length) {
                    err = { code: 404, message: 'Not found' };
                }
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
//Reg Stud Grade Course 
function ReadStudGradeCourse(id, cb) {
    console.log(id)
    pool.getConnection(function (err, connection) {
        connection.query(
             [" select sgcid as id,a.stud_ref,a.curr_seat,a.c_name " ,
                " from " ,
                "  ( select stud_ref,curr_seat,c_name from  studinfo where curr_class=?) as a",
                  "left join",
                   "( select sgcid,stud_ref,seat,c_name from  mrs_stud_grade_course where classno=?) as b",
                 " on a.stud_ref=b.stud_ref",
                "order by curr_seat"].join(" "),
            [id,id], (err, res) => {
                if (!err && !res.length) {
                    err = { code: 404, message: 'Not found' };
                }
                if (err) { cb(err); return; }
                console.log(res)
                cb(null, res);
                connection.release();
            });
    });
}
function AddStudGradeCourse(aObj,cno, cb) {
    let keys1 = Object.keys(aObj);
    for (let i=0;i<keys1.length;i++){
        let k=keys1[1];
        let v=aObj[k];

    }
}


//Reg Stud Grade Course 


module.exports = {
    createSchema: createSchema,
    listCourseBy: listCourseBy,
    readstudcourse: readstudcourse,
    readpingyu: readpingyu,
    readconduct: readconduct,
    readgrademark: readgrademark,
    savegrademark: savegrademark,
    savegrademarkarray: savegrademarkarray,
    updateGCNameArray:updateGCNameArray,
    updateMrkPubDate: updateMrkPubDate,
    ReadMarksysAuth: ReadMarksysAuth,
    list: list,
    listMore: listMore,
    StatisticsRead: StatisticsRead,
    DataReaderQuery: DataReaderQuery,
    create: create,
    read: read,
    update: update,
    delete: _delete,
    listcoursesubitem: listcoursesubitem,
    addcoursesubitem: addcoursesubitem,
    readcoursesubitem: readcoursesubitem,
    readclassnostud: readclassnostud,
    updateCoursesubitemDataJson: updateCoursesubitemDataJson,
    savecoursesubitem: savecoursesubitem,
    ObserveListCourseSubitemByStaf:ObserveListCourseSubitemByStaf,
    ObserveListCourseSubitemBySCID:ObserveListCourseSubitemBySCID,
    
    RegObserver:RegObserver,
    listObserveListSCID:listObserveListSCID,

    ReadStudGradeCourse:ReadStudGradeCourse,
    AddStudGradeCourse:AddStudGradeCourse,
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
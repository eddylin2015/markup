'use strict';

const mysql = require('mysql');
const config = require('../../config');
const options = {
  host: config.get('MYSQL_INFO_host'),
  user: config.get('MYSQL_INFO_user'),
  password: config.get('MYSQL_INFO_password'),
  database: config.get('MYSQL_INFO_db'),
  encoding:'utf8',
  charset:'utf8mb4'  ,
  multipleStatements: true,
  acquireTimeout: 50000
};
const pool = mysql.createPool(options);

function list(userId, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` where createdById=? order by id DESC LIMIT ? OFFSET ?', [userId,limit, token],
            (err, results) => {
                if (err) {
                    cb(err); return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();
            }
        );
    });
}

function listBy(userId, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE `createdById` = ? order by id DESC LIMIT ? OFFSET ?  ;',
            [userId, limit, token],
            (err, results) => {
                if (err) {
                    cb(err); return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();
            });
    });
}

function listToNote(userid,limit,token,cb){
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){ cb(err); return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE topNote=1 order by id DESC LIMIT ? OFFSET ?  ;',
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

function listTimestampStatusBy(createdById, sdate,edate, limit, token, cb)
{
    token = token ? parseInt(token, limit) : 0;  //limit 60
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE `createdById` = ?  and (`logDate` between ? and ? )  order by  id LIMIT ? OFFSET ?',
            [createdById,sdate,edate,limit, token],
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

function listTimestampBy(userId, author, sdate,edate, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE `author` = ?  and (`logDate` between ? and ? ) order by if(rootid = 0, id, rootid),parentid  LIMIT ? OFFSET ?',
            [author,sdate,edate,limit, token],
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

function listByKW( kw, jobtype,sdate, edate, deptlog, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    if(deptlog==1){
        pool.getConnection(function (err, connection) {
            if(err){cb(err);return;}
            connection.query(
                "SELECT * FROM `classeval` WHERE `deptlog`=0 and (`logDate` between ? and ? ) order by if(`rootid` = 0, `id`, `rootid`) DESC LIMIT ? OFFSET ?",
                [  sdate, edate, limit, token],
                (err, results) => {
                    if (err) { cb(err); return; }
                    const hasMore = results.length === limit ? token + results.length : false;
                    cb(null, results, hasMore);
                    connection.release();
                });
        });
    }
    else if (jobtype == "") {
        pool.getConnection(function (err, connection) {
            if(err){cb(err);return;}
            connection.query(
                "SELECT * FROM `classeval` WHERE (`description` like ? )  and (`logDate` between ? and ? ) order by if(rootid = 0, id, rootid),parentid  LIMIT ? OFFSET ?",
                ["%" + kw + "%",  sdate, edate, limit, token],
                (err, results) => {
                    if (err) { cb(err); return; }
                    const hasMore = results.length === limit ? token + results.length : false;
                    cb(null, results, hasMore);
                    connection.release();
                });
        });
    }
    else {
        pool.getConnection(function (err, connection) {
            if(err){cb(err);return;}
            connection.query(
                "SELECT * FROM `classeval` WHERE (`description` like ? and `jobtype` like ? )  and (`logDate` between ? and ? ) order by if(rootid = 0, id, rootid),parentid  LIMIT ? OFFSET ?",
                ["%" + kw + "%", "%" + jobtype + "%", sdate, edate, limit, token],
                (err, results) => {
                    if (err) { cb(err); return;  }
                    const hasMore = results.length === limit ? token + results.length : false;
                    cb(null, results, hasMore);
                    connection.release();
                });
        });
    }
}

function listByParentid(userId, rootid, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE id=? or `rootid` = ? or `parentid` = ?  LIMIT ? OFFSET ?',
            [rootid, rootid, rootid, limit, token],
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

function create(userId, data, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query('INSERT INTO `classeval` SET ?', data, (err, res) => {
            if (err) {
                cb(err);
                return;
            }
            read(userId,res.insertId, cb);
            connection.release();
        });
    });
}

function read(userId, id, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `classeval` WHERE `id` = ? ', id, (err, results) => {
                if (!err && !results.length) {
                    err = {
                        code: 404,
                        message: 'Not found'
                    };
                }
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, results[0]);
                connection.release();
            });
    });
}

function update(userId, id, data, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'UPDATE `classeval` SET ? WHERE `id` = ?  and `createdById` = ?', [data, id, userId], (err) => {
                if (err) {
                    cb(err);
                    return;
                }
                read(userId, id, cb);
                connection.release();
            });
    });
}

function updateGroupStatus(rootid, status) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'UPDATE `classeval` SET deptlog = ? WHERE id = ? or rootid= ? ', [status, rootid, rootid], (err) => {
                if (err) {
                    cb(err);
                    return;
                }
                connection.release();
            });
    });
}

function _delete(userId,id, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query('DELETE FROM `classeval` WHERE `id` = ?  and  `createdById` = ?',[ id, userId ],  cb);
        connection.release();
    });
}

module.exports = {
    createSchema: createSchema,
    list: list,
    listBy: listBy,
    listToNote:listToNote,
    listTimestampBy: listTimestampBy,
    listTimestampStatusBy:listTimestampStatusBy,
    listByParentid: listByParentid,
    listByKW: listByKW,
    updateGroupStatus: updateGroupStatus,
    create: create,
    read: read,
    update: update,
    delete: _delete
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
    const connection = mysql.createConnection(extend({
        multipleStatements: true
    }, config));
    connection.query(
    `CREATE DATABASE IF NOT EXISTS \`deptwork\`
     DEFAULT CHARACTER SET = 'utf8mb4'
     DEFAULT COLLATE 'utf8mb4_bin';
     USE \`deptwork\`;
        CREATE TABLE classeval (
            id int(11) NOT NULL AUTO_INCREMENT,
            ce_Date varchar(10) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Dept varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_SectNo varchar(2) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Subject varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Teacher varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_CNo varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Room varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Status varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            # 學生表現Listen to Perform
            ce_StdPerform varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_CMStatus varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_CMTidy varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_CMNote varchar(128) COLLATE utf8mb4_bin DEFAULT NULL,
            # 學生常規
            ce_WrgSleep varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_WrgConcent varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_WrgClOrder varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_WrgManner varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_WrgOtherDesc varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_WrgOther varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            # 老師表現
            ce_TchTeach varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_TchMaterial varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_TchITWrit varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_TchCommu varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_TchNote varchar(128) COLLATE utf8mb4_bin DEFAULT NULL,
            # 校園環境
            ce_Note varchar(128) COLLATE utf8mb4_bin DEFAULT NULL,
            createdById varchar(8) COLLATE utf8mb4_bin DEFAULT NULL,
            logDate varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            title varchar(128) COLLATE utf8mb4_bin DEFAULT NULL,
            ce_Mng varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
            PRIMARY KEY (id)
          ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        (err) => {
            if (err) {
                throw err;
            }
            console.log('Successfully created schema');
            connection.end();
        }
    );
}
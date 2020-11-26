﻿'use strict';
const mysql = require('mysql');
const mysqlcfg = require('../../mysql250/mysql250config');
const pool = mysqlcfg.esdbPool;

function list(userid,limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        // Use the connection
        connection.query(
            'SELECT * FROM `mrs_course_detail` order by course_d_id DESC LIMIT ? OFFSET ?', [limit, token],
            (err, results) => {
                if (err) {
                    cb(err);
                    return;
                }
                const hasMore = results.length === limit ? token + results.length : false;
                cb(null, results, hasMore);
                connection.release();
            }
        );
    });
}

function listByUserId(userId, limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `mrs_course_detail` WHERE `staf_ref` = ? order by course_d_id DESC LIMIT ? OFFSET ?  ;',
            [userId, limit, token],
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


function create( data, cb) {
       
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query('INSERT INTO `mrs_course_detail` SET ?', data, (err, res) => {
            if (err) {
                cb(err);
                return;
            }
            read(res.insertId, cb);
            connection.release();
        });
    });
}

function read(userid, id, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'SELECT * FROM `mrs_course_detail` WHERE `course_d_id` = ? ', id, (err, results) => {
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

function update( id, data, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query(
            'UPDATE `mrs_course_detail` SET ? WHERE `id` = ?  ', [data, id], (err) => {
                if (err) {
                    cb(err);
                    return;
                }
                read( id, cb);
                connection.release();
            });
    });
}
function _delete(id, cb) {
    pool.getConnection(function (err, connection) {
        if(err){cb(err);return;}
        connection.query('DELETE FROM `mrs_course_detail` WHERE `id` = ?  ',[ id ],  cb);
        connection.release();
    });
}

module.exports = {
    createSchema: createSchema,
    list: list,
    listByUserId:listByUserId,
    create: create,
    read: read,
    update: update,
    delete: _delete,
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
    throw "not implement!";
    const connection = mysql.createConnection(extend({
        multipleStatements: true
    }, config));

    connection.query(``,
        (err) => {
            if (err) {
                throw err;
            }
            console.log('Successfully created schema');
            connection.end();
        }
    );
}
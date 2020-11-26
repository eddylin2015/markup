'use strict';

const mysql = require('mysql');
const mysqlcfg = require('../../routes/mysql250/mysql250config');
const sql='SELECT item FROM eschool.kassesstopic_subjectitem where ka_id in (131,132,133) order by kasi_id;';
const pool = mysqlcfg.esdbPool;
const fs = require('fs');

var keyv="";
var connection = mysql.createConnection(mysqlcfg.mysql250options);

connection.connect();

connection.query(sql, function (error, results, fields) {
  if (error) throw error;
  for(let i=0;i<results.length;i++)
  {
      let row=results[i];
      console.log(row.item);
      
  }
 // fs.writeFile('py-data-utf.txt', keyv, function (err) {
 //   if (err) throw err;
 //   console.log('Replaced!');
 // });
});

connection.end();




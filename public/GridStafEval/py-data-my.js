'use strict';

const mysql = require('mysql');
const mysqlcfg = require('../../routes/mysql250/mysql250config');
const sql='SELECT id,key0,optionAns FROM eschool.stafeval_gridqiz order by key0;';
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
      let tid=row.optionAns.substring(0,1);
      if(tid=="1"||tid=="2"||tid=="3"||tid=="4"||tid=="5")
      {
        keyv+=row.key0+" "+row.optionAns+",";
      }else{
         let key1=0;
         switch(row.key0.substring(3,4))
         {
             case "a": key1=1;break;
             case "b": key1=2;break;
             case "c": key1=3;break;
             case "d": key1=4;break;                                       
             case "e": key1=5;break;        
         }
         console.log(row.id,row.key0,row.key0.substring(3,4),key1,row.optionAns);
         //console.log( `update eschool.stafeval_gridqiz set optionAns=CONCAT('${key1}.',optionAns) where id=${row.id}; `);

      }
  }
  fs.writeFile('py-data-utf.txt', keyv, function (err) {
    if (err) throw err;
    console.log('Replaced!');
  });
});

connection.end();




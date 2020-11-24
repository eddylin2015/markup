// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const express = require('express');
const images = require('./images');
const mc = require('../../lib/mailrelay.js');
const netutils=require('../../lib/net_utils.js');

function getModel () {
    return require(`./model-mysql-pool`);
}

function fmt_title(username, datestr, description) {
    //description = description.split("\n")[0];
    //description = description.length > 10 ? description.substring(0, 10) : description;
    //datestr = datestr.length > 10 ? datestr.substring(0, 10) : datestr;
    return username + ":" + datestr + ":" + description;
}

const router = express.Router();

//router.use((req, res, next) => {
 // res.set('Content-Type', 'text/html');
 // next();
//});

router.get('/', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    getModel().list(req.user.id, 10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    //res.render('classeval/list.pug', {
    res.render('classeval/list.pug', {
      profile: req.user ,
      books: entities,
      nextPageToken: cursor
    });
  });
});
/**
 * GET /books/add
 * Display a form for creating a book.
 */
function getSectNo(){
  let d = new Date();
  let h = d.getHours();
  let m = d.getMinutes();
  let time_str=(h<10?"0":"")+h+":"+(m<10?"0":"")+m
  const time_sectno=["08:30","09:30","10:15","11:05","11:50","14:10","14:55","15:50","16:30"]
  const sectno=["一","二","三","四","五","六","七","八",""]
  for(let i=0;i<time_sectno.length;i++)
    if(time_str<time_sectno[i]) return i==0?"":sectno[i-1]
  return "";
}
router.get('/add', (req, res) => {
  let sectno=req.query.sectno?req.query.sectno:getSectNo();
  res.render('classeval/form.pug', {
      profile: req.user,
      book: {
          author: req.user.username,
          authorname: req.user.displayName,
          ce_Mng:req.user.username,
          ce_SectNo:sectno,
          id:0,
          title: fmt_title(req.user.username, netutils.fmt_now(0), 'CE_log'),
          logDate: netutils.fmt_now(0),
          createdById: req.user.id,
          ce_Date: netutils.fmt_now(0),
      },
      action: 'Add',
      title_act:"增加一堂課記錄",
  });
});
/**
 * POST /books/add
 * Create a book.
 */
// [START add]
router.post(
    '/add',
    images.multer.single('image'),
  (req, res, next) => {
     const data = req.body;
    // If the user is logged in, set them as the creator of the book.
    if (req.user) {
      data.createdById = req.user.id;
    }
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    // Save the data to the database.
    //data.title = fmt_title(data.ce_Mng, data.logDate, data.ce_Note)
    getModel().create(req.user.id, data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);
// Use the oauth2.required middleware to ensure that only logged-in users
// can access this handler.
router.get('/mine', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
  getModel().listBy(
    req.user.id,
    10,
    req.query.pageToken,
    (err, entities, cursor, apiResponse) => {
      if (err) {
        next(err);
        return;
      }
      res.render('classeval/list.pug', {
        profile: req.user,
        books: entities,
        nextPageToken: cursor
      });
    }
  );
});
router.get('/top', require('connect-ensure-login').ensureLoggedIn(), (req, res, next) => {
    getModel().listToNote(
      req.user.id,
      10,
      req.query.pageToken,
      (err, entities, cursor, apiResponse) => {
        if (err) {
          next(err);
          return;
        }
        res.render('classeval/list.pug', {
          profile: req.user,
          books: entities,
          nextPageToken: cursor
        });
      }
    );
  });
router.get('/searchform', (req, res) => {
    res.render('classeval/searchform.pug', {
        profile: req.user,
        book: {
            createdById: req.user.username,
            logDate: netutils.fmt_now(60),
            logDate2: netutils.fmt_now(0),
            title:""
        },
        action: 'Post'
    });
});
router.post('/searchform', require('connect-ensure-login').ensureLoggedIn(),
    images.multer.single('image'),
    (req, res) => {
        const data = req.body;
        var createdById = req.user.id;
        let logendstatus=data.logendstatus;
    getModel().listTimestampStatusBy(
      createdById,
      data.slogDate,
      data.elogDate,
      60,
      req.query.pageToken,
      (err, entities, cursor, apiResponse) => {
            if (err) {
                next(err);
                return;
            }
            res.render('classeval/table.pug', {
                profile: req.user,
                books: entities,
                nextPageToken: cursor
            });
        }
    );
    });
///
router.get('/searchforKW', (req, res) => {
    //res.render('classeval/searchforKW.pug', {
    res.render('classeval/searchforKW.pug', {
        profile: req.user,
        book: {
            kw: "",
            logDate:  netutils.fmt_now(60),
            logDate2: netutils.fmt_now(0),
            title: ""
        },
        action: 'Post'
    });
});
router.post('/searchforKW', require('connect-ensure-login').ensureLoggedIn(),
    images.multer.single('image'),
    (req, res,next) => {
        const data = req.body;
        var patt1 = /[,';]/g;
        var kw = data.KW.replace(patt1, "");
        var jobtype= data.jobtype.replace(patt1, "");
        getModel().listByKW(
            kw,
            jobtype,
            data.slogDate,
            data.elogDate,
            data.deptlog,
            10,
            req.query.pageToken,
            (err, entities, cursor, apiResponse) => {
                if (err) {
                    next(err);
                    return;
                }
                res.render('classeval/list.pug', {  //table.pug
                    profile: req.user,
                    books: entities,
                    nextPageToken: cursor
                });
            }
        );
    });

router.get('/addtext', (req, res) => {
    res.render('classeval/formPlain.pug', {
        profile: req.user,
        book: {
            author: req.user.username,
            authorname: req.user.displayName,
            logDate: netutils.fmt_now(0),
            rootid: 0,
            title: fmt_title(req.user.username, netutils.fmt_now(0), 'worklog'),
            createdById: req.user.id,
            parentid:0,
            deptlog: 0
        },
        action: 'Add'
    });
});
router.get('/:book/follow', (req, res) => {
    res.render('classeval/form.pug', {
        profile: req.user,
        book: {
            deptlog: 0,
            author: req.user.username,
            authorname: req.user.displayName,
            logDate: netutils.fmt_now(0),
            parentid: req.params.book,
            rootid: req.query.rid,
            title: fmt_title(req.user.username, netutils.fmt_now(0), 'worklog'),
            description: req.query.t,
            createdById : req.user.id
        },
        action: 'Follow'
    });
});
router.post(
    '/:book/follow',
    images.multer.single('image'),
    (req, res, next) => {
        const data = req.body;
        // If the user is logged in, set them as the creator of the book.
        if (req.user) {
            data.createdBy = req.user.displayName;
            data.createdById = req.user.id;
        } else {
            data.createdBy = 'Anonymous';
        }
        if (data.rootid > 0 && data.deptlog !== 0) { getModel().updateGroupStatus(data.rootid, data.deptlog); }
        if (data.deptlog == 1) data.deptlog = 2;
        // Was an image uploaded? If so, we'll use its public URL
        // in cloud storage.
        // Save the data to the database.
        data.title = fmt_title(data.author, data.logDate, data.description)
        getModel().create(req.user.id, data, (err, savedData) => {
            if (err) {
                next(err);
                return;
            }
            res.redirect(`${req.baseUrl}/${savedData.id}`);
        });
    }
);
router.get('/followlist', (req, res) => {
    getModel().listByParentid(
        req.user.id,
        req.query.rid,
        10,
        req.query.pageToken,
        (err, entities, cursor, apiResponse) => {
            if (err) {
                next(err);
                return;
            }
            res.render('classeval/table.pug', {
                profile: req.user,
                books: entities,
                nextPageToken: cursor
            });
        }
    );
});

router.post(
    '/addtext',
    images.multer.single('image'),
  (req, res, next) => {
     const data = req.body;
    // If the user is logged in, set them as the creator of the book.
    if (req.user) {
      data.createdBy = req.user.displayName;
      data.createdById = req.user.id;
    } else {
      data.createdBy = 'Anonymous';
     }
    if (data.deptlog == 1) data.deptlog = 2;
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    // Save the data to the database.
    data.title = fmt_title(data.author, data.logDate, data.description)
    getModel().create(req.user.id, data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
    if(data.mailto && data.mailto.length>0)
    mc.relaymail(25,'ASPMX.L.GOOGLE.COM', "it@mail.mbc.edu.mo", data.mailto+"@mail.mbc.edu.mo", data.title,data.description);
  }
);
// [END add]

/**
 * GET /books/:id/edit
 * Display a book for editing.
 */
router.get('/:book/edit', (req, res, next) => {
    getModel().read(req.user.id, req.params.book, (err, entity) => {
    if (err) {
      next(err);
      return;
      }
    res.render('classeval/form.pug', {
      profile: req.user,
      book: entity,
      action: 'Edit'
    });
  });
});
/**
 * GET /books/:id/ckedit
 * Display a book for editing.
 */
router.get('/:book/edittext', (req, res, next) => {
    getModel().read(req.user.id, req.params.book, (err, entity) => {
    if (err) {
      next(err);
      return;
      }
    res.render('classeval/formPlain.pug', {
      profile: req.user,
      book: entity,
      action: 'Edit'
    });
  });
});
router.post(
    '/:book/edittext',    
    images.multer.array('upload',16),   
    require('connect-ensure-login').ensureLoggedIn(),
    (req, res, next) => {
    const data = req.body;   
    console.log(data);
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    //if (req.file && req.file.cloudStoragePublicUrl) {
    //  req.body.imageUrl = req.file.cloudStoragePublicUrl;
    //}
    if (data.rootid > 0 && data.deptlog !== 0) { getModel().updateGroupStatus(data.rootid, data.deptlog); }
    if (data.deptlog==1) data.deptlog = 2;
    data.title = fmt_title(data.author, data.logDate, data.description);
    getModel().update(req.user.id,req.params.book, data, (err, savedData) => {
      if (err) {  next(err);  return; }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
    if(data.mailto && data.mailto.length>0)
    mc.relaymail(25,'ASPMX.L.GOOGLE.COM', "it@mail.mbc.edu.mo", data.mailto+"@mail.mbc.edu.mo", data.title,data.description);
  }
);
router.post('/:book/imageUploader', images.multer.any(),   function(req, res) {
    //req.file/req.files
	res.send({
		"uploaded": 1,
    	"fileName": "IMAGE.PNG",
    	"url": "/ckeditorimages/"+req.files[0].filename
	})
})
/**
 * POST /books/:id/edit
 * Update a book.
 */
router.post(
    '/:book/edit',
    images.multer.single('image'), require('connect-ensure-login').ensureLoggedIn(),
    (req, res, next) => {
    const data = req.body;
    
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    //if (req.file && req.file.cloudStoragePublicUrl) {
    //  req.body.imageUrl = req.file.cloudStoragePublicUrl;
    //}
    if (data.rootid > 0 && data.deptlog !== 0) { getModel().updateGroupStatus(data.rootid, data.deptlog); }
    if (data.deptlog==1) data.deptlog = 2;
    //data.title = fmt_title(data.author, data.logDate, data.description);
    getModel().update(req.user.id,req.params.book, data, (err, savedData) => {
      if (err) {  next(err);  return; }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
    if(data.mailto && data.mailto.length>0)
    mc.relaymail(25,'ASPMX.L.GOOGLE.COM', "it@mail.mbc.edu.mo", data.mailto+"@mail.mbc.edu.mo", data.title,data.description);
  }
);
/**
 * GET /books/:id
 *
 * Display a book.
 */
router.get('/:book', (req, res, next) => {
  getModel().read(req.user.id, req.params.book, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('classeval/view.pug', {
      profile: req.user,
      book: entity
    });
  });
});
/**
 * GET /books/:id/delete
 *
 * Delete a book.
 */
router.get('/:book/delete', (req, res, next) => {
    getModel().delete(req.user.id,req.params.book, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/books/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});
module.exports = router;
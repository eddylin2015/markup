'use strict';

const express = require('express');
const images = require('./images');
const fs=require('fs')

function getModel() {
  return require(`./model-mysql-pool`);
}
function GetSID(req) {
  return (req.user && req.user.marksys_info) ? req.user.marksys_info[0][0].session_id : null;
}
function authRequired(req, res, next) {
  if (!req.user) {
      req.session.oauth2return = req.originalUrl;
      return res.redirect('/auth/login');
  }else if("2002024,2003006,2006011,2012021,".indexOf(req.user.id)==-1){
      return res.end(`${req.user.id}please auth required for Markup_CrsMng_Crud !`);
  }
  let c=req.session.c?req.session.c:req.query.c;
  if("2003006"==req.user.id && c!="P"){
    return res.end(`${req.user.id}please auth required for Markup_CrsMng_Crud for P !`);
  }else if("2006011,2012021".indexOf(req.user.id)>-1 && !(c=="SC"&&c=="SG")){
    return res.end(`${req.user.id}please auth required for Markup_CrsMng_Crud for S !`);
  }
  next();
}

const router = express.Router();

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
// Set Content-Type for all responses for these routes
// router.use((req, res, next) => {
//   res.set('Content-Type', 'text/html');
//   next();
// });

router.get('/', authRequired, (req, res, next) => {
  let c=req.query.c?req.query.c:"S";
  req.session.c=c;
  res.redirect("crsmng/list");
});

router.get('/list', authRequired, (req, res, next) => {
  let c=req.session.c;
  getModel().list(req.user.id, c, 100, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render('markup/crsmng/list.pug', {
      profile: req.user,
      books: entities,
      nextPageToken: cursor,
      c:c
    });
  });
});
router.get('/grid', authRequired, (req, res, next) => {
  let c=req.session.c;
  getModel().list(req.user.id, c, 300, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render('markup/crsmng/grid.pug', {
      profile: req.user,
      books: entities,
      nextPageToken: cursor,
      c:c
    });
  });
});
router.get('/api/seccourse.json',authRequired,  (req, res) => {
  res.type('application/json'); 
  let c=req.session.c;
  let path = process.cwd() + "\\jsondata\\CourseDefPri.json";
  if(c=='SC')
    {path = process.cwd() + "\\jsondata\\CourseDefSC.json";}
  else if(c=='SG')
    {path = process.cwd() + "\\jsondata\\CourseDefSG.json";}
  var readStream = fs.createReadStream(path);
  readStream.pipe(res);
});

router.get('/api/secteacher.json',authRequired,  (req, res) => {
  res.type('application/json'); 
  let c=req.session.c;
  let spk=c.startsWith('S')?"1":"2";
  const path = process.cwd() + "\\jsondata\\teachers_obj.json";
  fs.readFile(path, (err, data) => {
    if (err) throw err;
    data = data.toString().replace(/\W+\[/, '[');
    let obj=JSON.parse(data);
    let result=[];
    for(let i=0;i<obj.length;i++){
      if(obj[i].sect == spk)
        result.push(`${obj[i].staf_ref} ${obj[i].cname}`)
    }
    res.end(JSON.stringify(result));
    });
});

 /**
 * GET /books/add
 * Display a form for creating a book.
 */
router.get('/add', authRequired, (req, res) => {
  let c=req.session.c;
  let spk=c.startsWith('S')?1:2;
  res.render('markup/crsmng/form.pug', {
    profile: req.user,
    c:c,
    batch:req.query.batch,
    book: {
      session_id: Number(GetSID(req)),
      SPK:spk ,
      classno:"",
      groupid:100,
      rate:100,
      c_section_total:0,
      c_ng_id:9,
      tab:100
    },
    action: 'Add'
  });
});

/**
 * POST /books/add
 * Create a book.
 */
// [START add]
router.post(
  '/add',authRequired,
  images.multer.single('image'),
  (req, res, next) => {
    const data = req.body;
    if(data.staf_ref&&data.staf_ref.length>=8) data.staf_ref=data.staf_ref.substring(0,8)
    /* if (req.user) {data.createdBy = req.user.displayName; data.createdById = req.user.id;} else {data.createdBy = 'Anonymous';}*/
    getModel().create(req.user.id, data, (err, savedData) => {
      if (err) {
        next(err);
        return;
      }
      if(req.query.batch){
        let msg=JSON.stringify(savedData)  
        savedData.course_d_id=0;
        let c=req.session.c;
        res.render('markup/crsmng/form.pug', {
          profile: req.user,
          c:c,
          batch:req.query.batch,
          book:savedData,
          action: 'Add',
          msg:msg
        });
        //
     }else{
      res.redirect(`${req.baseUrl}/${savedData.course_d_id}`);
     }
    });
  }
);
// [END add]
/**
 * GET /books/:id/edit
 * Display a book for editing.
 */
router.get('/:book/edit', (req, res, next) => {
  let c=req.session.c;
  getModel().read(req.user.id, req.params.book, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('markup/crsmng/form.pug', {
      profile: req.user,
      book: entity,
      c:c,
      batch:req.query.batch,
      action: 'Edit'
    });
  });
});


router.post('/:book/imageUploader',authRequired, images.multer.any(), function (req, res) {
  //req.file
  res.send({
    "uploaded": 1,
    "fileName": "IMAGE.PNG",
    "url": "/ckeditorimages/" + req.files[0].filename
  })
})

/**
 * POST /books/:id/edit
 * Update a book.
 */
router.post(
  '/:book/edit',
  images.multer.single('image'),authRequired,
  (req, res, next) => {
    let data = req.body;
    if(data.staf_ref&&data.staf_ref.length>=8) data.staf_ref=data.staf_ref.substring(0,8)
    //if (req.file && req.file.cloudStoragePublicUrl) { req.body.imageUrl = req.file.cloudStoragePublicUrl; }
    getModel().update(req.user.id, req.params.book, data, (err, savedData) => {
      if (err) { next(err); return; }
      if(req.query.batch){
         res.end(JSON.stringify(savedData))  
      }else{
      res.redirect(`${req.baseUrl}/${savedData.course_d_id}`);
      }
    });
  }
);
/**
 * GET /books/:id
 * Display a book.
 */
router.get('/:book', (req, res, next) => {
  let c=req.query.c?req.query.c:"S";
  getModel().read(req.user.id, req.params.book, (err, entity) => {
    
    if (err) {
      next(err);
      return;
    }
    res.render('markup/crsmng/view.pug', {
      profile: req.user,
      book: entity,
      c:c
    });
  });
});

/**
 * GET /books/:id/delete
 * Delete a book.
 */
router.get('/:book/delete',authRequired, (req, res, next) => {
  getModel().delete(req.user.id, req.params.book, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/////////////End//////////////////

router.get('/mine', authRequired, (req, res, next) => {
  getModel().listBy(
    req.user.id,
    10,
    req.query.pageToken,
    (err, entities, cursor, apiResponse) => {
      if (err) {
        next(err);
        return;
      }
      res.render('markup/crsmng/list.pug', {
        profile: req.user,
        books: entities,
        nextPageToken: cursor
      });
    }
  );
});

router.get('/top', authRequired, (req, res, next) => {
  getModel().listToNote(
    req.user.id,
    10,
    req.query.pageToken,
    (err, entities, cursor, apiResponse) => {
      if (err) {
        next(err);
        return;
      }
      res.render('markup/crsmng/list.pug', {
        profile: req.user,
        books: entities,
        nextPageToken: cursor
      });
    }
  );
});

router.get('/searchform',authRequired, (req, res) => {
  res.render('markup/crsmng/searchform.pug', {
    profile: req.user,
    book: {
      author: req.user.username,
      logDate: netutils.fmt_now(60),
      logDate2: netutils.fmt_now(0),
      title: ""
    },
    action: 'Post'
  });
});

router.post('/searchform', authRequired,
  images.multer.single('image'),
  (req, res) => {
    const data = req.body;
    var author = data.author;
    let logendstatus = data.logendstatus;
    getModel().listTimestampStatusBy(
      req.user.id,
      author,
      data.slogDate,
      data.elogDate,
      logendstatus,
      30,
      req.query.pageToken,
      (err, entities, cursor, apiResponse) => {
        if (err) {
          next(err);
          return;
        }
        res.render('markup/crsmng/table.pug', {
          profile: req.user,
          books: entities,
          nextPageToken: cursor
        });
      }
    );
  });

  router.get('/searchforKW',authRequired, (req, res) => {
  res.render('markup/crsmng/searchforKW.pug', {
    profile: req.user,
    book: {
      kw: "",
      logDate: netutils.fmt_now(60),
      logDate2: netutils.fmt_now(0),
      title: ""
    },
    action: 'Post'
  });
});

router.post('/searchforKW', authRequired,
  images.multer.single('image'),
  (req, res, next) => {
    const data = req.body;
    var patt1 = /[,';]/g;
    var kw = data.KW.replace(patt1, "");
    var jobtype = data.jobtype.replace(patt1, "");
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
        res.render('markup/crsmng/list.pug', {  
          profile: req.user,
          books: entities,
          nextPageToken: cursor
        });
      }
    );
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
'use strict';
const mrs_docx_dir = "C:/AppServ/Web/public/ckeditorimages";
function sendUploadToGCS(req, res, next) {
        return next();
}
// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer');
var storage = Multer.diskStorage({
    //设置上传文件路径,以后可以扩展成上传至七牛,文件服务器等等
    //Note:如果你传递的是一个函数，你负责创建文件夹，如果你传递的是一个字符串，multer会自动创建
    destination: mrs_docx_dir,
    //TODO:文件区分目录存放
    //给上传文件重命名
    filename: function (req, file, cb) {
        let filename_ = "worknote_"+req.params.book+"_"+req.user.id+"_"+file.originalname;
        var fileFormat = (file.originalname).split(".");
        //cb(null, file.originalname);
        cb(null, filename_);
        //cb(null, file.fieldname + "." + fileFormat[fileFormat.length - 1]);
    }
});
//destination: function(req, file, callback) { callback(null, './uploads')},
//filename: function(req, file, callback) { callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))}
const multer = Multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});
module.exports = {
    multer
};

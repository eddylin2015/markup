// attend

'use strict';
function sendUploadToGCS(req, res, next) {
        return next();
}
// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer');
const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});

module.exports = {
    multer
};

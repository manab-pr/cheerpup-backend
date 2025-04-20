const multer = require("multer");
// multer middleware
const storage = multer.memoryStorage();
const singleUpload = multer({ storage }).single("file");


module.exports = { singleUpload };

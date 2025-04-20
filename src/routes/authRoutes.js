const express = require('express');
const { register, login } = require('../controllers/authController');
const { singleUpload } = require('../middlewares/multer');

const router = express.Router();

// auth routes

router.post('/signup', singleUpload, register);
router.post('/login', login);

module.exports = router;

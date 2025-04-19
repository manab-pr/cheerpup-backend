const express = require('express');
const router = express.Router();
const { handleUserEmotion } = require('../controllers/openAiController');
const { verifyToken } = require('../middlewares/verifyToken');

router.post('/chat', verifyToken, handleUserEmotion);

module.exports = router;

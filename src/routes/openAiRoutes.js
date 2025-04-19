const express = require('express');
const router = express.Router();
const { handleUserEmotion } = require('../controllers/openAiController');

router.post('/chat', handleUserEmotion);

module.exports = router;

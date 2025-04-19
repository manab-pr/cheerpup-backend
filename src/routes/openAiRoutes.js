const express = require('express');
const router = express.Router();
const { handleUserEmotion } = require('../controllers/openAiController');
const { verifyToken } = require('../middlewares/verifyToken');
const { handleEnhancedChat } = require('../controllers/enhancedChatController');

router.post('/chat', verifyToken, handleUserEmotion);
router.post('/enhanced-chat', verifyToken, handleEnhancedChat);

module.exports = router;

const express = require('express');
const router = express.Router();
const { handleUserEmotion } = require('../controllers/openAiController');
const { verifyToken } = require('../middlewares/verifyToken');
const { handleEnhancedChat } = require('../controllers/enhancedChatController');
const checkPremium = require('../middlewares/checkPremium');

router.post('/chat', verifyToken, handleUserEmotion);
router.post('/enhanced-chat', verifyToken, checkPremium, handleEnhancedChat);

module.exports = router;

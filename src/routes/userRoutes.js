const express = require('express');
const {
  updateUser,
  changePassword,
  addExercise,
  updateExercise,
  deleteExercise,
  addChat,
  deleteChat,
} = require('../controllers/userController');
const { verifyTokenandAuthorization } = require('../middlewares/verifyToken');

const router = express.Router();

// Profile update & password
router.put('/:id', verifyTokenandAuthorization, updateUser);
router.put('/password/:id', verifyTokenandAuthorization, changePassword);

// Exercises
router.post('/exercise/:id', verifyTokenandAuthorization, addExercise);
router.put('/exercise/:userId/:exerciseId', verifyTokenandAuthorization, updateExercise);
router.delete('/exercise/:userId/:exerciseId', verifyTokenandAuthorization, deleteExercise);

// Chat History
router.post('/chat/:id', verifyTokenandAuthorization, addChat);
router.delete('/chat/:id/:chatId', verifyTokenandAuthorization, deleteChat);

module.exports = router;

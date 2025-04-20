const express = require('express');
const {
  updateUser,
  changePassword,
  addExercise,
  updateExercise,
  deleteExercise,
  addChat,
  deleteChat,
  markExerciseAsDone,
  getChatHistory,
  getUserDetails,
  getUserExercises
} = require('../controllers/userController');
const { verifyTokenandAuthorization } = require('../middlewares/verifyToken');
const { singleUpload } = require('../middlewares/multer');

const router = express.Router();

// Profile endpoints
router.put('/:id', verifyTokenandAuthorization, singleUpload, updateUser);
router.put('/password/:id', verifyTokenandAuthorization, changePassword);
router.get('/:id', verifyTokenandAuthorization, getUserDetails);


// Exercise endpoints
router.post('/exercise/:id', verifyTokenandAuthorization, addExercise);
router.put('/exercise/:userId/:exerciseId', verifyTokenandAuthorization, updateExercise);
router.put(
  '/exercise/:id/:exerciseId/done',
  verifyTokenandAuthorization,
  markExerciseAsDone
);
router.get('/exercises/:id', verifyTokenandAuthorization, getUserExercises);
router.delete('/exercise/:userId/:exerciseId', verifyTokenandAuthorization, deleteExercise);

// Chat History endpoints
router.post('/chat/:id', verifyTokenandAuthorization, addChat);
router.delete('/chat/:id/:chatId', verifyTokenandAuthorization, deleteChat);
router.get('/chat/:id', verifyTokenandAuthorization, getChatHistory);


module.exports = router;

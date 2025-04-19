const bcrypt = require('bcryptjs');
const User = require('../models/User');


// --- Profile Update ---
const updateUser = async (req, res) => {
  try {
    const fields = [
      'name', 'email', 'age', 'gender',
      'isPhysicalHelpBefore', 'isPhysicalDistress',
      'medicines', 'seriousAlertCount'
    ];

    const updateData = {};

    // Update fields from body
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle profile image upload if present
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      updateData.profileImage = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// --- Change Password ---
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json("Old password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json("Password updated");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// --- Exercises ---
const addExercise = async (req, res) => {
  try {
    const { name, durationInDays, streak } = req.body;

    const user = await User.findById(req.params.id);
    user.exercises.push({ name, durationInDays, streak });
    await user.save();

    res.status(200).json("Exercise added");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const updateExercise = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const exercise = user.exercises.id(req.params.exerciseId);
    if (!exercise) return res.status(404).json("Exercise not found");

    Object.assign(exercise, req.body);
    await user.save();

    res.status(200).json("Exercise updated");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const deleteExercise = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.exercises.id(req.params.exerciseId).remove();
    await user.save();
    res.status(200).json("Exercise removed");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// --- API Chat History ---
const addChat = async (req, res) => {
  try {
    const { userMessage, systemMessage, suggestedExercise, suggestedActivity } = req.body;
    const user = await User.findById(req.params.id);
    user.apiChatHistory.push({ userMessage, systemMessage, suggestedExercise, suggestedActivity });
    await user.save();

    res.status(200).json("Chat history added");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const deleteChat = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.apiChatHistory.id(req.params.chatId).remove();
    await user.save();
    res.status(200).json("Chat entry deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

module.exports = {
  updateUser,
  changePassword,
  addExercise,
  updateExercise,
  deleteExercise,
  addChat,
  deleteChat,
};

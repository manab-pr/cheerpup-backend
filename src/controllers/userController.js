const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');

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

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Change Password ---
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Exercises ---
const addExercise = async (req, res) => {
  try {
    const { name, durationInDays } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.exercises.push({
      name,
      durationInDays,
      streak: [],        
      lastUpdated: null, 
    });

    await user.save();

    res.status(200).json({
      message: "Exercise added successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const markExerciseAsDone = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
if (!user) return res.status(404).json("User not found");

const exercise = user.exercises.id(req.params.exerciseId);
if (!exercise) return res.status(404).json("Exercise not found");

    const today = new Date();
    const lastUpdated = exercise.lastUpdated ? new Date(exercise.lastUpdated) : null;

    let missedDays = 0;

    if (lastUpdated) {
      const diffTime = today.setHours(0, 0, 0, 0) - lastUpdated.setHours(0, 0, 0, 0);
      missedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // If it's the first time, assume all previous days were missed
      missedDays = 0;
    }

    // Fill missed days with 0
    for (let i = 0; i < missedDays; i++) {
      exercise.streak.push(0);
    }

    // Push 1 for today
    exercise.streak.push(1);
    exercise.lastUpdated = new Date();

    await user.save();

    res.status(200).json("Exercise marked as done for today");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateExercise = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const exercise = user.exercises.id(req.params.exerciseId);
    if (!exercise) return res.status(404).json({ message: "Exercise not found" });

    Object.assign(exercise, req.body);
    await user.save();

    res.status(200).json({
      message: "Exercise updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteExercise = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.exercises.id(req.params.exerciseId).remove();
    await user.save();

    res.status(200).json({
      message: "Exercise deleted successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- API Chat History ---
const addChat = async (req, res) => {
  try {
    const { userMessage, systemMessage, suggestedExercise, suggestedActivity } = req.body;
    const user = await User.findById(req.params.id);
    user.apiChatHistory.push({ userMessage, systemMessage, suggestedExercise, suggestedActivity });
    await user.save();

    res.status(200).json({
      message: "Chat history added successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.apiChatHistory.id(req.params.chatId).remove();
    await user.save();

    res.status(200).json({
      message: "Chat entry deleted successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getChatHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      chatHistory: user.apiChatHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserExercises = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('exercises');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ exercises: user.exercises });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  updateUser,
  changePassword,
  addExercise,
  markExerciseAsDone,
  updateExercise,
  deleteExercise,
  addChat,
  deleteChat,
  getChatHistory,
  getUserDetails,
  getUserExercises,
};

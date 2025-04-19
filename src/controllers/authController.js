const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const cloudinary = require('cloudinary').v2;
const { emailRegex, phoneRegex } = require('../constants/regex');

const register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    if (!name  || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with provided email or phone number" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImageUrl = '';
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

      profileImageUrl = result.secure_url;
    }

    const newUser = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      profileImage: profileImageUrl,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        isAdmin: newUser.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = newUser._doc;

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    let query;

    if (emailRegex.test(identifier)) {
      query = { email: identifier };
    } else if (phoneRegex.test(identifier)) {
      query = { phoneNumber: identifier };
    } else {
      return res.status(400).json({ message: "Identifier must be a valid email or phone number" });
    }

    const user = await User.findOne(query);

    if (!user) return res.status(401).json({ message: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = user._doc;

    res.status(200).json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = { register, login };

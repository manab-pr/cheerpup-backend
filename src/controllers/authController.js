const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

const register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    if (!phoneNumber) return res.status(400).json("Phone number is required");

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) throw new Error(error);
          profileImageUrl = result.secure_url;
        }
      );
      req.file.stream.pipe(result);
    }

    const newUser = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      profileImage: profileImageUrl,
    });

    await newUser.save();
    res.status(201).json("User registered successfully");
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json("Email or phone number is required");
    }

    const user = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (!user) return res.status(401).json("User not found");

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json("Wrong password");

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: pass, ...userData } = user._doc;

    res.status(200).json({ token, user: userData });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

module.exports = { register, login };

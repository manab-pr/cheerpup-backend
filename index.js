const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cloudinary = require('cloudinary');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const openAiRoutes = require('./src/routes/openAiRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to DB
connectDB();

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Routes
app.use('/api/v1/openai', openAiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

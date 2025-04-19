import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cloudinary from 'cloudinary';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
// Add other route imports as needed (e.g., userRoutes, productRoutes, etc.)

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// API Routes
app.use('/api/auth', authRoutes);
// Example: app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

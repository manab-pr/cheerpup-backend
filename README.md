# CheerPup Backend

CheerPup Backend is a robust, secure, and feature-rich RESTful API built using Node.js, Express.js, MongoDB, and Cloudinary. It integrates OpenAI's GPT-4o API to deliver emotionally intelligent interactions, supporting users through various emotional states.

---

## 🚀 Features

- **User Authentication & Authorization**:
  - Secure Signup/Login
  - JWT-based Authentication

- **User Management**:
  - Profile creation and updating
  - Profile image uploading via Cloudinary
  - Password management and encryption (bcrypt)

- **AI-powered Emotional Support**:
  - Personalized emotional responses using GPT-4o
  - Enhanced chat capabilities with rich contextual understanding
  - Serious mood detection and alerting

- **Activity Tracking & Recommendations**:
  - Exercise and activity management
  - Mood tracking and analytics
  - Personalized music recommendations

---

## 🔧 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT
- **AI Integration**: OpenAI GPT-4o
- **Cloud Storage**: Cloudinary

---

## 📌 API Documentation

### Authentication

- **Signup** (`POST /api/v1/auth/signup`)
- **Login** (`POST /api/v1/auth/login`)

### User Management

- **Get User Details** (`GET /api/v1/user/:id`)
- **Update User Details** (`PUT /api/v1/user/:id`)
- **Change Password** (`PUT /api/v1/user/change-password/:id`)

### Exercises Management

- **Add Exercise** (`POST /api/v1/user/exercise/:id`)
- **Update Exercise** (`PUT /api/v1/user/exercise/:userId/:exerciseId`)
- **Delete Exercise** (`DELETE /api/v1/user/exercise/:userId/:exerciseId`)
- **Mark Exercise as Done** (`POST /api/v1/user/exercise/done/:id/:exerciseId`)

### Emotional Support (AI)

- **Chat** (`POST /api/v1/openai/chat`)
- **Enhanced Chat** (`POST /api/v1/openai/enhanced-chat`)

---

## 🛠 Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd cheerpup-backend
npm install
```

### Environment Variables
Create a `.env` file in your root directory and configure it as follows:

```env
PORT=5000
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
JWT_SECRET=<your-jwt-secret>
MONGO_URI=<your-mongodb-uri>
OPENAI_API_KEY=<your-openai-api-key>
```

### Start Server

```bash
npm run dev
```

---

## 🚧 Project Structure

```
cheerpup-backend/
├── src
│   ├── config
│   │   ├── db.js
│   │   └── openai.js
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   └── constants
├── .env
├── package.json
└── index.js
```

---

## 📷 Screenshots
Include screenshots of your API responses or Postman collections here.

---

## 📜 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.



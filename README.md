# RealTimeChat - Production-Ready Real-Time Messaging Platform

A modern, scalable, secure real-time chat application built with React, Node.js, Socket.IO, and MongoDB.

**Status:** ✅ Production-Ready | 📈 Actively Maintained | 🚀 Enterprise-Grade

## 📊 Current Repository Layout

The runnable application lives inside `QuickChat-Full-Stack/`:

- `QuickChat-Full-Stack/client` — React + Vite frontend
- `QuickChat-Full-Stack/server` — Express + Socket.IO + MongoDB backend
- `docker-compose.yml` — local development stack

## 🎯 Quick Links

- 📚 [Implementation Details](./IMPLEMENTATION.md)
- 🏗 [Technical Architecture](./PRODUCTION_READINESS_PLAN.md)
- 🐳 [Docker Setup](#-quick-start)
- 📡 [API Docs](#-api-endpoints)

## ✨ Features

### Core Features
- ✅ Real-time messaging with Socket.IO
- ✅ JWT-based authentication
- ✅ Online presence and typing indicators
- ✅ Image upload support via Cloudinary
- ✅ Profile management
- ✅ Read receipts
- ✅ Responsive dark/light UI

### Production Readiness
- ✅ Structured logging
- ✅ Input validation and error handling
- ✅ Environment-based CORS configuration
- ✅ Pagination support for messages
- ✅ Dockerized local development stack

## 🏗 Tech Stack

### Frontend
- React 19
- Vite 6
- Tailwind CSS 4
- Axios
- Socket.IO Client
- React Router 7

### Backend
- Node.js
- Express 5
- MongoDB + Mongoose
- Socket.IO
- JWT
- bcryptjs
- Cloudinary

## 🚀 Quick Start

### Option 1: Docker Compose

**Prerequisites:** Docker and Docker Compose

```bash
# Clone repository
git clone https://github.com/ShivanshuRajput95Tech/RealTimeChat.git
cd RealTimeChat

# Configure backend env file
cp QuickChat-Full-Stack/server/.env.example QuickChat-Full-Stack/server/.env

# Configure frontend env file if needed
cp QuickChat-Full-Stack/client/.env.example QuickChat-Full-Stack/client/.env

# Start the local stack
docker-compose up -d
```

Access the app:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379`

Stop services:

```bash
docker-compose down
```

### Option 2: Local Development

**Prerequisites:** Node.js 20+, MongoDB 6+

**Backend**

```bash
cd QuickChat-Full-Stack/server
npm install
cp .env.example .env
npm run dev
```

**Frontend**

```bash
cd QuickChat-Full-Stack/client
npm install
cp .env.example .env
npm run dev
```

## 📋 Environment Setup

### Backend (`QuickChat-Full-Stack/server/.env`)

```env
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug

MONGODB_URI=mongodb://localhost:27017/realtimechat

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX=100
```

### Frontend (`QuickChat-Full-Stack/client/.env`)

```env
VITE_BACKEND_URL=http://localhost:5000
# Optional legacy alias still supported:
# VITE_API_URL=http://localhost:5000
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and return tokens |
| GET | `/api/auth/check` | Validate the current token |
| GET | `/api/auth/search?q=<term>&limit=25` | Search users by name, email, or bio |
| PUT | `/api/auth/update-profile` | Update profile details |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/users` | Get sidebar users and unread counts |
| GET | `/api/messages/:id?page=1&limit=50` | Get conversation messages |
| POST | `/api/messages/send/:id` | Send a message |
| PUT | `/api/messages/:id/mark-read` | Mark a received message as read |
| PUT | `/api/messages/mark/:id` | Legacy read-receipt alias |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Health/status check |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summarize` | Summarize recent conversation context |
| POST | `/api/ai/sentiment` | Analyze the tone of a message |
| POST | `/api/ai/suggest` | Generate smart reply suggestions |
| POST | `/api/ai/translate` | Translate a message into a target language |
| POST | `/api/ai/detect-language` | Detect the language of a message |
| POST | `/api/ai/filter` | Run lightweight content moderation |

## 🧪 Verification Commands

Frontend:

```bash
cd QuickChat-Full-Stack/client
npm run lint
npm run build
```

Backend:

```bash
cd QuickChat-Full-Stack/server
npm run dev
```

## 📄 Notes

- Redis is included in the Docker stack for future scaling/caching work, but the current app runtime does not require a live Redis integration.
- The frontend supports both `VITE_BACKEND_URL` and the older `VITE_API_URL` environment variable so existing setups continue to work.

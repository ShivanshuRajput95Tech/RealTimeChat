# RealTimeChat

A modern real-time chat application built with **React**, **Node.js**, **Socket.io**, and **MongoDB**.

---

## 🚀 What You Get

- ✅ **Real-time messaging** (Socket.io)
- ✅ **Authentication** with JWT + secure password hashing
- ✅ **Online status indicators** (who’s online now)
- ✅ **Image sharing** via Cloudinary
- ✅ **Responsive UI** (TailwindCSS)
- ✅ **Security**: rate limiting, input sanitization, helmet headers

---

## 🧱 Tech Stack

### Frontend
- React 19 (hooks)
- Vite (fast dev server + HMR)
- TailwindCSS
- Socket.io-client for real-time updates

### Backend
- Node.js + Express
- Socket.io (real-time messaging)
- MongoDB (Atlas or local)
- Mongoose (ODM)
- JWT for auth
- Cloudinary for image uploads

---

## 🧰 Setup (Local Development)

### 1) Clone repository
```bash
git clone https://github.com/ShivanshuRajput95Tech/RealTimeChat.git
cd RealTimeChat
```

### 2) Backend setup
```bash
cd server
npm install
cp .env.example .env
# (edit .env with your values)
npm start
```

### 3) Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4) Access the app
- Frontend: http://localhost:5173 (or the port Vite chooses)
- Backend: http://localhost:5000

---

## 📌 Environment Variables

### Backend (`server/.env`)
```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLOUDINARY_CLOUD_NAME=<cloudinary_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:5000
```

> ✅ Tip: When running inside GitHub Codespaces or another dev proxy, the frontend uses Vite proxy configuration to route `/api` requests to the backend.

---

## 📡 API Overview

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/check` — Validate session
- `PUT /api/auth/update-profile` — Update user profile

### Messaging
- `GET /api/message/users` — Load sidebar users + unread counts
- `GET /api/message/:id` — Load messages for a conversation
- `POST /api/message/:id` — Send message to a user
- `PUT /api/message/mark/:id` — Mark message as seen

---

## 🧭 Project Structure

```
RealTimeChat/
├── frontend/                # React app (Vite)
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Route pages
│   │   └── lib/             # Utilities
│   └── vite.config.js
├── server/                  # REST + socket backend
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Express middleware (auth, rate limit, etc.)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── lib/                 # Utilities (DB, Cloudinary, etc.)
│   └── server.js            # Entry point
└── README.md
```

---

## 🔐 Security & Best Practices

- **JWT auth** with token stored in localStorage
- **Rate limiting** to prevent brute-force attacks
- **Input sanitization** to reduce injection/XSS risks
- **Helmet headers** for security hardening
- **DB connection pooling** and graceful shutdown

---

## ✅ Contributing

1. Fork
2. Create a feature branch
3. Commit & push
4. Open a PR

---

## 📄 License

This project is licensed under the **ISC License**.

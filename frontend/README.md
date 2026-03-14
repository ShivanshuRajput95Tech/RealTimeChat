# Quick Chat 💬

Quick Chat is a real-time messaging web application built with **React, Node.js, MongoDB, and Socket.io**.
Users can register, log in, send messages instantly, share images, and see online status in real time.

---

## 🚀 Features

* 🔐 JWT Authentication (Signup / Login)
* 💬 Real-time messaging with Socket.io
* 🟢 Online user indicators
* 🖼 Image sharing with Cloudinary
* 👤 User profile management
* 👀 Message seen status
* 🔍 User search
* 📱 Responsive chat UI

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* TailwindCSS
* Context API
* Axios
* Socket.io Client
* React Router

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* Socket.io
* Cloudinary

---

## 📂 Project Structure

```
quick-chat
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   └── server.js
│
└── frontend
    ├── components
    ├── context
    ├── pages
    ├── utils
    └── App.jsx
```

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```
git clone https://github.com/yourusername/quick-chat.git
```

---

### 2️⃣ Install dependencies

Backend

```
cd backend
npm install
```

Frontend

```
cd frontend
npm install
```

---

### 3️⃣ Setup environment variables

Create `.env` in the backend folder.

```
PORT=5000

MONGODB_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```

---

### 4️⃣ Run the project

Backend

```
npm run server
```

Frontend

```
npm run dev
```

---

## 🌐 Application Flow

1. User signs up or logs in
2. JWT token authenticates requests
3. Socket.io connects user for real-time messaging
4. Messages are stored in MongoDB
5. Images are uploaded to Cloudinary
6. Online users and new messages update instantly

---

## 📸 Screenshots

(Add screenshots of your chat UI here)

---

## 📄 License

MIT License

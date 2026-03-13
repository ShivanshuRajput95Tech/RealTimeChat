import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

// ---------------- SOCKET.IO ----------------
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

export const userSocketMap = new Map();

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("add-user", (userId) => {
        userSocketMap.set(userId, socket.id);
        socket.userId = userId;
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            userSocketMap.delete(socket.userId);
        }
        console.log("User disconnected:", socket.id);
    });

});

// ---------------- MIDDLEWARE ----------------
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------- ROUTES ----------------
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server is running"
    });
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// ---------------- SERVER START ----------------
const PORT = process.env.PORT || 5000;

const startServer = async() => {

    try {

        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {

        console.error("Failed to start server:", error);
        process.exit(1);

    }

};

startServer();

export default server;
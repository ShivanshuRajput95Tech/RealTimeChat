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

// Socket.IO
export const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// store online users
export const userSocketMap = {};

io.on("connection", (socket) => {

    socket.on("add-user", (userId) => {
        userSocketMap[userId] = socket.id;
    });

    socket.on("disconnect", () => {
        Object.keys(userSocketMap).forEach((userId) => {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
            }
        });
    });

});

// Middleware
app.use(cors());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api/status", (req, res) => {
    res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// Database
await connectDB();

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
                console.log(` Server running on port ${PORT}`);
            }
            export default server;
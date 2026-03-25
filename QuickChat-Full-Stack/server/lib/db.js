import mongoose from "mongoose";
import logger from "./logger.js";

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        logger.error("MONGODB_URI not set in .env");
        process.exit(1);
    }

    let connectionUri = uri;
    if (!connectionUri.includes("/chat-app")) {
        connectionUri = connectionUri.replace(/\/?(\?.*)?$/, "/chat-app$1");
    }
    if (!connectionUri.includes("retryWrites")) {
        const separator = connectionUri.includes("?") ? "&" : "?";
        connectionUri += `${separator}retryWrites=true&w=majority`;
    }

    mongoose.connection.on("connected", () => logger.info("Database Connected"));
    mongoose.connection.on("error", (err) => logger.error("Database Error:", err.message));
    mongoose.connection.on("disconnected", () => logger.warn("Database Disconnected"));
    mongoose.connection.on("reconnected", () => logger.info("Database Reconnected"));

    try {
        await mongoose.connect(connectionUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        });
        logger.info("Database connection established");
    } catch (error) {
        logger.error("Database connection failed:", error.message);
        logger.error("Troubleshooting:");
        logger.error("  1. Whitelist your IP: https://cloud.mongodb.com → Network Access → Add IP");
        logger.error("  2. Or click 'Allow Access from Anywhere' (0.0.0.0/0)");
        logger.error("  3. Check MONGODB_URI in server/.env");
        logger.error("  4. Make sure the cluster is not paused");
        process.exit(1);
    }
};

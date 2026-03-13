import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Function to connect to the database
export const connectDB = async() => {
    try {
        // MongoDB connection options for better performance
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
        };

        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}/chatapp`, options);

        // `bufferMaxEntries` is not supported in newer MongoDB drivers. Use `bufferCommands` instead.
        mongoose.connection.on("connected", () => {
            console.log("✅ Connected to MongoDB Atlas");
        });

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️  MongoDB disconnected");
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ Database connection error:", error);
        process.exit(1);
    }
};
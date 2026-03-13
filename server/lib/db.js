import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Function to connect to the database
export const connectDB = async() => {
    try {

        mongoose.connection.on("connected", () => {
            console.log("Connected to the database");
        });

        await mongoose.connect(`${process.env.MONGODB_URI}/chatapp`);

    } catch (error) {
        console.log("Database connection error:", error);
    }
};
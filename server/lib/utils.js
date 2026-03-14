import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateToken = (userId) => {
    return jwt.sign({ userId },
        process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );
};
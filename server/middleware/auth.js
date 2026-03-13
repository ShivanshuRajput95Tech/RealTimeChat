import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async(req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        // Expect format: Bearer TOKEN
        const token = authHeader.startsWith("Bearer ") ?
            authHeader.split(" ")[1] :
            authHeader;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (error) {

        console.error("Auth middleware error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
};
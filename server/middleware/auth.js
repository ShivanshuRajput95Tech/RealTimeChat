import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async(req, res, next) => {
    try {

        let token = req.headers.authorization || req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized" });
        }

        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Invalid token" });
    }
};
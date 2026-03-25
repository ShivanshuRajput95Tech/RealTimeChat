import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../lib/logger.js";

export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Token expired",
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload",
            });
        }

        const user = await User.findById(decoded.userId).select("-password").lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        logger.error("Auth error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export const authenticate = protectRoute;

export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.headers.token;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.userId) {
                    const user = await User.findById(decoded.userId).select("-password").lean();
                    if (user) {
                        req.user = user;
                        req.userId = user._id;
                    }
                }
            } catch (jwtError) {
                logger.debug("Optional auth token invalid:", jwtError.message);
            }
        }
        next();
    } catch (error) {
        next();
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const memberRole = req.memberRole;
        if (!memberRole || !roles.includes(memberRole)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
        }
        next();
    };
};

export default { protectRoute, authenticate, optionalAuth, authorize };

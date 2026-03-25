import express from "express";
import { checkAuth, login, signup, updateProfile, updateSettings, getUserById, searchUsers, getWeeklyActivity, getUserActivityById } from "../controllers/userController.js";
import { getUserLastSeen } from "../controllers/enhancedMessageController.js";
import { protectRoute } from "../middleware/auth.js";
import { signupValidation, loginValidation } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const userRouter = express.Router();

userRouter.post("/signup", authLimiter, signupValidation, signup);
userRouter.post("/login", authLimiter, loginValidation, login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.put("/settings", protectRoute, updateSettings);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.get("/search", protectRoute, searchUsers);
userRouter.get("/activity", protectRoute, getWeeklyActivity);
userRouter.get("/:userId/activity", protectRoute, getUserActivityById);
userRouter.get("/:userId/last-seen", protectRoute, getUserLastSeen);
userRouter.get("/:userId", protectRoute, getUserById);

export default userRouter;
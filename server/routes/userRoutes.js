import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { updateProfile, checkAuth } from "../controllers/userController.js";

const userRouter = express.Router();

// check if user is authenticated
userRouter.get("/check", protectRoute, checkAuth);

// update profile
userRouter.put("/update-profile", protectRoute, updateProfile);

export default userRouter;
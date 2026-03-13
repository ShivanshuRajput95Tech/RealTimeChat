import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { signup, login, updateProfile, checkAuth } from "../controllers/userController.js";

const userRouter = express.Router();

// signup
userRouter.post("/signup", signup);

// login
userRouter.post("/login", login);

// check if user is authenticated
userRouter.get("/check", protectRoute, checkAuth);

// update profile
userRouter.put("/update-profile", protectRoute, updateProfile);

export default userRouter;
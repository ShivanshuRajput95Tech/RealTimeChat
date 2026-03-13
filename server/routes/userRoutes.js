import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { updateProfile, checkAuth } from "../controllers/userController.js";

const router = express.Router();

/*
    GET /api/auth/check
    Verify if user is authenticated
*/
router.get("/check", protectRoute, checkAuth);

/*
    PUT /api/auth/update-profile
    Update user profile
*/
router.put("/update-profile", protectRoute, updateProfile);

export default router;
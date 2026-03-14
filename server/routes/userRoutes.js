import express from "express";
import { signup, login, checkAuth, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
<<<<<<< HEAD
import { signup, login, updateProfile, checkAuth } from "../controllers/userController.js";
=======
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

const router = express.Router();

<<<<<<< HEAD
// signup
userRouter.post("/signup", signup);

// login
userRouter.post("/login", login);

// check if user is authenticated
userRouter.get("/check", protectRoute, checkAuth);
=======
router.post("/signup", signup);
router.post("/login", login);
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
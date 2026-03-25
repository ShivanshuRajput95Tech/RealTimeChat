import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
} from "../controllers/noteController.js";

const router = express.Router();

router.get("/", protectRoute, getNotes);
router.post("/", protectRoute, createNote);
router.get("/:noteId", protectRoute, getNoteById);
router.put("/:noteId", protectRoute, updateNote);
router.delete("/:noteId", protectRoute, deleteNote);

export default router;
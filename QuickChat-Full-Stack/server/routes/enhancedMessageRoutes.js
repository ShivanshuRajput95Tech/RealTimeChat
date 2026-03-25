import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    searchMessages,
    setMessagePriority,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getUserLastSeen,
    updateMessageStatus,
} from "../controllers/enhancedMessageController.js";

const router = express.Router();

router.get("/search", protectRoute, searchMessages);
router.put("/:messageId/priority", protectRoute, setMessagePriority);
router.put("/:messageId/status", protectRoute, updateMessageStatus);

router.get("/templates", protectRoute, getTemplates);
router.post("/templates", protectRoute, createTemplate);
router.put("/templates/:templateId", protectRoute, updateTemplate);
router.delete("/templates/:templateId", protectRoute, deleteTemplate);
router.post("/templates/:templateId/use", protectRoute, useTemplate);

export default router;
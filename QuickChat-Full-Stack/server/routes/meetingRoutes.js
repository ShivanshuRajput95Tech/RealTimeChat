import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    createMeeting,
    getWorkspaceMeetings,
    getMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    updateMeeting,
    deleteMeeting,
    respondToInvite,
    getByCode,
} from "../controllers/meetingController.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createMeeting);
router.get("/workspace/:workspaceId", getWorkspaceMeetings);
router.get("/code/:code", getByCode);
router.get("/:meetingId", getMeeting);
router.put("/:meetingId", updateMeeting);
router.delete("/:meetingId", deleteMeeting);
router.post("/:meetingId/join", joinMeeting);
router.post("/:meetingId/leave", leaveMeeting);
router.post("/:meetingId/end", endMeeting);
router.post("/:meetingId/respond", respondToInvite);

export default router;

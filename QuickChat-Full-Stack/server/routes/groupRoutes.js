import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    createGroup,
    getGroups,
    getGroup,
    updateGroup,
    deleteGroup,
    addMembers,
    removeMember,
    leaveGroup,
    getGroupMessages,
    sendGroupMessage,
    joinGroup,
    regenerateGroupInviteCode,
    toggleGroupInvite,
    getGroupInviteInfo,
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getGroups);
groupRouter.get("/:groupId", protectRoute, getGroup);
groupRouter.put("/:groupId", protectRoute, updateGroup);
groupRouter.delete("/:groupId", protectRoute, deleteGroup);
groupRouter.post("/:groupId/members", protectRoute, addMembers);
groupRouter.delete("/:groupId/members/:userId", protectRoute, removeMember);
groupRouter.post("/:groupId/leave", protectRoute, leaveGroup);
groupRouter.get("/:groupId/messages", protectRoute, getGroupMessages);
groupRouter.post("/:groupId/messages", protectRoute, sendGroupMessage);
groupRouter.post("/join", protectRoute, joinGroup);
groupRouter.post("/:groupId/regenerate-invite", protectRoute, regenerateGroupInviteCode);
groupRouter.post("/:groupId/toggle-invite", protectRoute, toggleGroupInvite);
groupRouter.get("/:groupId/invite", protectRoute, getGroupInviteInfo);

export default groupRouter;

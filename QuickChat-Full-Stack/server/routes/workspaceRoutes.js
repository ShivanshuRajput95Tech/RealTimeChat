import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { requireRole, requireMinRole } from "../middleware/rbac.js";
import {
    createWorkspace,
    getWorkspaces,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    regenerateInviteCode,
    joinWorkspace,
    leaveWorkspace,
    updateMemberRole,
    removeMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.post("/", protectRoute, createWorkspace);
workspaceRouter.get("/", protectRoute, getWorkspaces);
workspaceRouter.get("/:workspaceId", protectRoute, getWorkspace);
workspaceRouter.put("/:workspaceId", protectRoute, requireMinRole("admin"), updateWorkspace);
workspaceRouter.delete("/:workspaceId", protectRoute, requireRole("owner"), deleteWorkspace);
workspaceRouter.post("/join", protectRoute, joinWorkspace);
workspaceRouter.post("/:workspaceId/regenerate-invite", protectRoute, requireMinRole("admin"), regenerateInviteCode);
workspaceRouter.post("/:workspaceId/leave", protectRoute, leaveWorkspace);
workspaceRouter.put("/:workspaceId/members/:userId/role", protectRoute, requireMinRole("admin"), updateMemberRole);
workspaceRouter.delete("/:workspaceId/members/:userId", protectRoute, requireMinRole("moderator"), removeMember);

export default workspaceRouter;

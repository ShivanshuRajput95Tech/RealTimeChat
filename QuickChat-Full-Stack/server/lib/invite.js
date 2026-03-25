import crypto from "crypto";

export const generateInviteCode = () => {
    return crypto.randomBytes(8).toString("hex");
};

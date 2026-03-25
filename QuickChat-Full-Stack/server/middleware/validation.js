import { validationResult, body, param, query } from "express-validator";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

export const signupValidation = [
    body("fullName")
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Full name must be between 2 and 50 characters"),
    body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 6, max: 100 })
        .withMessage("Password must be between 6 and 100 characters"),
    body("bio")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Bio must be less than 500 characters"),
    validate,
];

export const loginValidation = [
    body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Valid email is required"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
    validate,
];

export const sendMessageValidation = [
    body("text")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 4000 })
        .withMessage("Message text must be less than 4000 characters"),
    body("image")
        .optional()
        .isString()
        .matches(/^data:image\/\w+;base64,/)
        .withMessage("Invalid image format"),
    body("replyTo")
        .optional()
        .isMongoId()
        .withMessage("Invalid replyTo ID"),
    validate,
];

export const updateMessageValidation = [
    body("text")
        .isString()
        .trim()
        .isLength({ min: 1, max: 4000 })
        .withMessage("Message text must be between 1 and 4000 characters"),
    validate,
];

export const reactionValidation = [
    body("emoji")
        .isString()
        .trim()
        .isLength({ min: 1, max: 10 })
        .withMessage("Invalid emoji"),
    validate,
];

export const idParamValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid ID format"),
    validate,
];

export const searchQueryValidation = [
    query("q")
        .isString()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Search query must be between 1 and 200 characters"),
    query("type")
        .optional()
        .isIn(["all", "direct", "channel", "group"])
        .withMessage("Invalid search type"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt()
        .withMessage("Limit must be between 1 and 100"),
    query("offset")
        .optional()
        .isInt({ min: 0 })
        .toInt()
        .withMessage("Offset must be a positive integer"),
    validate,
];

export const scheduleMessageValidation = [
    body("text")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 4000 })
        .withMessage("Message text must be less than 4000 characters"),
    body("scheduledAt")
        .isISO8601()
        .withMessage("Invalid scheduled date")
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            if (date <= now) {
                throw new Error("Scheduled time must be in the future");
            }
            if (date > new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
                throw new Error("Cannot schedule more than 30 days in advance");
            }
            return true;
        }),
    body("receiverId")
        .optional()
        .isMongoId()
        .withMessage("Invalid receiver ID"),
    body("channelId")
        .optional()
        .isMongoId()
        .withMessage("Invalid channel ID"),
    body("groupId")
        .optional()
        .isMongoId()
        .withMessage("Invalid group ID"),
    validate,
];

export const broadcastValidation = [
    body("text")
        .isString()
        .trim()
        .isLength({ min: 1, max: 4000 })
        .withMessage("Broadcast message must be between 1 and 4000 characters"),
    body("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),
    validate,
];

export default {
    validate,
    signupValidation,
    loginValidation,
    sendMessageValidation,
    updateMessageValidation,
    reactionValidation,
    idParamValidation,
    searchQueryValidation,
    scheduleMessageValidation,
    broadcastValidation,
};

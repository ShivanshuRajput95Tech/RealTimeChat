// lib/schemas.js
// 2026 Zod validation schemas - Type-safe request validation

/**
 * 2026 BEST PRACTICE: Use Zod for runtime type validation
 * 
 * Benefits:
 * 1. Single source of truth for validation rules
 * 2. Type inference for TypeScript
 * 3. Better error messages
 * 4. Runtime safety (TypeScript doesn't guarantee runtime types)
 * 5. Composable schemas for reuse
 * 
 * Install: npm install zod
 */

// import { z } from 'zod';

/**
 * User Schemas
 */

// Base user fields (reusable)
const userBase = {
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  fullName: z
    .string('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name contains invalid characters'),
  
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .default(''),
  
  profilePic: z
    .string('Profile picture must be a string')
    .max(5242880, 'Profile picture exceeds 5MB limit')
    .optional()
    .nullable(),
};

// Signup validation
export const signupSchema = z.object({
  email: userBase.email,
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  fullName: userBase.fullName,
  bio: userBase.bio,
});

// Login validation
export const loginSchema = z.object({
  email: userBase.email,
  password: z.string('Password is required'),
});

// Update profile validation
export const updateProfileSchema = z.object({
  fullName: userBase.fullName.optional(),
  bio: userBase.bio,
  profilePic: userBase.profilePic,
}).refine(
  (obj) => Object.values(obj).some(v => v !== undefined && v !== null),
  'At least one field must be provided for update'
);

/**
 * Message Schemas
 */

const messageBase = {
  text: z
    .string()
    .max(5000, 'Message text must be less than 5000 characters')
    .optional()
    .nullable(),
  
  image: z
    .string('Image must be a string (base64)')
    .max(5242880, 'Image exceeds 5MB limit (base64 encoded)')
    .optional()
    .nullable(),
};

// Send message validation
export const sendMessageSchema = z.object({
  text: messageBase.text,
  image: messageBase.image,
})
  .refine(
    (obj) => obj.text || obj.image,
    'Message must contain either text or image'
  );

/**
 * Pagination Schemas
 */

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '1');
      return Math.max(num, 1);
    }),
  
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '50');
      return Math.min(Math.max(num, 1), 100);  // Min 1, max 100
    }),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional().nullable(),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '50');
      return Math.min(Math.max(num, 1), 100);
    }),
});

/**
 * Search Schemas
 */

export const searchSchema = z.object({
  q: z
    .string('Search query is required')
    .min(1, 'Search query must not be empty')
    .max(100, 'Search query is too long')
    .trim(),
  
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '20');
      return Math.min(num, 50);
    }),
});

/**
 * Middleware for Zod validation (2026 best practice)
 * 
 * Usage in routes:
 * router.post('/send/:id',
 *   validateBody(sendMessageSchema),
 *   protectRoute,
 *   sendMessage
 * );
 */

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      // Extract first error for clarity
      const fieldError = error.errors[0];
      res.status(400).json({
        success: false,
        message: fieldError.message,
        field: fieldError.path[0],
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      const fieldError = error.errors[0];
      res.status(400).json({
        success: false,
        message: fieldError.message,
        field: fieldError.path[0],
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      const fieldError = error.errors[0];
      res.status(400).json({
        success: false,
        message: fieldError.message,
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

/**
 * TypeScript Type Inference (2026 best practice)
 * 
 * // In TypeScript files:
 * type SignupInput = z.infer<typeof signupSchema>;
 * type MessageInput = z.infer<typeof sendMessageSchema>;
 * type PaginationParams = z.infer<typeof paginationSchema>;
 */

// Export all schemas as a group
export const schemas = {
  user: {
    signup: signupSchema,
    login: loginSchema,
    updateProfile: updateProfileSchema,
  },
  message: {
    send: sendMessageSchema,
  },
  pagination: {
    standard: paginationSchema,
    cursor: cursorPaginationSchema,
  },
  search: searchSchema,
};

export default schemas;


const { z } = require("zod");

// Update own profile
const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80)
    .optional(),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .nullable()
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "Provide at least one field to update"
);

// Activate or deactivate user
const updateStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

// Change user role
const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
}).strict();

module.exports = {
  updateProfileSchema,
  updateStatusSchema,
  updateRoleSchema,
};

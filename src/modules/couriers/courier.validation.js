
const { z } = require("zod");

const createCourierSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().optional(),
  serviceAreas: z.array(z.string().trim().min(1)).min(1),
  pricePerDelivery: z.coerce.number().positive(),
}).strict();

const updateCourierSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().nullable().optional(),
  serviceAreas: z.array(z.string().trim().min(1)).min(1).optional(),
  pricePerDelivery: z.coerce.number().positive().optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict().refine(
  data => Object.keys(data).length > 0,
  "Provide at least one field to update"
);

const ledgerSchema = z.object({
  type: z.enum(["REWARD", "PENALTY"]),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(3).max(250),
}).strict();

module.exports = {
  createCourierSchema,
  updateCourierSchema,
  ledgerSchema,
};

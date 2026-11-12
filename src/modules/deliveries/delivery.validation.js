
const { z } = require("zod");

const createDeliverySchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(7).max(20),
  pickupAddress: z.string().trim().min(5),
  pickupArea: z.string().trim().min(2),
  destinationAddress: z.string().trim().min(5),
  destinationArea: z.string().trim().min(2),
  packageDescription: z.string().trim().min(2).max(250),
  packageWeight: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  scheduledAt: z.coerce.date().optional(),
}).strict();

const updateStatusSchema = z.object({
  status: z.enum([
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
  description: z.string().trim().max(250).optional(),
  cancellationReason: z.string().trim().min(3).max(250).optional(),
}).strict().refine(
  data => data.status !== "CANCELLED" || !!data.cancellationReason,
  "Cancellation reason is required"
);

const archiveSchema = z.object({
  isArchived: z.boolean(),
}).strict();

module.exports = {
  createDeliverySchema,
  updateStatusSchema,
  archiveSchema,
};

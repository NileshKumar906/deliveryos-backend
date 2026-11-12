
const express = require("express");
const controller = require("./delivery.controller");
const validation = require("./delivery.validation");

const validate = require("../../middleware/validate");
const {
  protect,
  authorize,
} = require("../../middleware/auth.middleware");

const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.use(protect);

// All authenticated users can access these routes.
// Service layer enforces customer ownership.
router.get("/track/:trackingId", asyncHandler(controller.track));
router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getOne));

// Customers can book deliveries.
// Internal staff can also create deliveries.
router.post(
  "/",
  authorize("ADMIN", "MANAGER", "OPERATOR", "CUSTOMER"),
  validate(validation.createDeliverySchema),
  asyncHandler(controller.create)
);

// Only internal staff can update delivery statuses.
router.patch(
  "/:id/status",
  authorize("ADMIN", "MANAGER", "OPERATOR"),
  validate(validation.updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

// Only Admin and Manager can archive deliveries.
router.patch(
  "/:id/archive",
  authorize("ADMIN", "MANAGER"),
  validate(validation.archiveSchema),
  asyncHandler(controller.archive)
);

module.exports = router;

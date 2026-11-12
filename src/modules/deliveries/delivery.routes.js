
const router = require("express").Router();
const controller = require("./delivery.controller");
const validation = require("./delivery.validation");
const validate = require("../../middleware/validate");
const { protect, authorize } = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.use(protect);

router.get("/track/:trackingId", asyncHandler(controller.track));
router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getOne));

router.post(
  "/",
  authorize("ADMIN", "MANAGER", "OPERATOR"),
  validate(validation.createDeliverySchema),
  asyncHandler(controller.create)
);

router.patch(
  "/:id/status",
  authorize("ADMIN", "MANAGER", "OPERATOR"),
  validate(validation.updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

router.patch(
  "/:id/archive",
  authorize("ADMIN", "MANAGER"),
  validate(validation.archiveSchema),
  asyncHandler(controller.archive)
);

module.exports = router;

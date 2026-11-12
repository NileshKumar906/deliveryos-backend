
const router = require("express").Router();
const controller = require("./courier.controller");
const validation = require("./courier.validation");
const validate = require("../../middleware/validate");
const { protect, authorize } = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.use(protect);

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getOne));

router.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  validate(validation.createCourierSchema),
  asyncHandler(controller.create)
);

router.patch(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  validate(validation.updateCourierSchema),
  asyncHandler(controller.update)
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(controller.remove)
);

router.post(
  "/:id/ledger",
  authorize("ADMIN", "MANAGER"),
  validate(validation.ledgerSchema),
  asyncHandler(controller.addLedger)
);

module.exports = router;

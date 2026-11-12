const router = require("express").Router();

const controller = require("./dispatch.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.use(protect);

router.post(
  "/:deliveryId/auto",
  authorize("ADMIN", "MANAGER", "OPERATOR"),
  asyncHandler(controller.autoDispatch)
);

module.exports = router;
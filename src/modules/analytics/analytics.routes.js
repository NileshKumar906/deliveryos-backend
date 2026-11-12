
const router = require("express").Router();

const controller = require("./analytics.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.use(protect);
router.use(authorize("ADMIN", "MANAGER"));

router.get("/dashboard", asyncHandler(controller.dashboard));
router.get("/deliveries", asyncHandler(controller.deliveryReport));
router.get("/couriers", asyncHandler(controller.courierPerformance));

module.exports = router;

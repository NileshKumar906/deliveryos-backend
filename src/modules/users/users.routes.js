
const express = require("express");

const usersController = require("./users.controller");

const {
  updateProfileSchema,
  updateStatusSchema,
  updateRoleSchema,
} = require("./users.validation");

const { protect, authorize } = require("../../middleware/auth.middleware");

const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

// All user routes require authentication.
router.use(protect);

// Current user routes
router.get(
  "/me",
  asyncHandler(usersController.getMe)
);

router.patch(
  "/me",
  validate(updateProfileSchema),
  asyncHandler(usersController.updateMe)
);

// ADMIN and MANAGER routes
router.get(
  "/",
  authorize("ADMIN", "MANAGER"),
  asyncHandler(usersController.getAllUsers)
);

router.get(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  asyncHandler(usersController.getUserById)
);

// ADMIN-only routes
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  validate(updateStatusSchema),
  asyncHandler(usersController.updateUserStatus)
);

router.patch(
  "/:id/role",
  authorize("ADMIN"),
  validate(updateRoleSchema),
  asyncHandler(usersController.updateUserRole)
);

module.exports = router;

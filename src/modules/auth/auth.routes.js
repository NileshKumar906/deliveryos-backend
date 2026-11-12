
const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("./auth.controller");
const { registerSchema, loginSchema } = require("./auth.validation");

const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
// POST /api/v1/auth/register
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

module.exports = router;


const jwt = require("jsonwebtoken");

const prisma = require("../config/database");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// ========================================
// VERIFY AUTHENTICATION
// ========================================

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = authorization.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Authentication token has expired", 401);
    }

    throw new AppError("Invalid authentication token", 401);
  }

  if (!decoded.sub) {
    throw new AppError("Invalid authentication token", 401);
  }

  // Retrieve current user rather than trusting stale role data in JWT.
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.sub,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("User account is unavailable", 401);
  }

  req.user = user;

  next();
});

// ========================================
// ROLE-BASED AUTHORIZATION
// ========================================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Prisma } = require("@prisma/client");

const prisma = require("../../config/database");
const env = require("../../config/env");
const AppError = require("../../utils/AppError");

// ========================================
// GENERATE JWT
// ========================================

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

// ========================================
// SAFE USER RESPONSE
// ========================================

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// ========================================
// REGISTER CUSTOMER
// ========================================

async function registerUser(data) {
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    env.BCRYPT_SALT_ROUNDS
  );

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        phone: data.phone,
        role: "CUSTOMER",
      },
    });

    console.log("[AUTH REGISTER] Customer created:", {
      email: user.email,
      role: user.role,
    });

    const token = generateToken(user);

    return {
      user: formatUser(user),
      token,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Email is already registered", 409);
    }

    throw error;
  }
}

// ========================================
// LOGIN USER
// ========================================

async function loginUser(data) {
  const email = data.email.trim().toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // ========================================
  // DEBUG: USER LOOKUP
  // ========================================

  console.log("[AUTH LOGIN] Email:", email);
  console.log("[AUTH LOGIN] User found:", !!user);

  if (user) {
    console.log("[AUTH LOGIN] Stored role:", user.role);
    console.log("[AUTH LOGIN] Account active:", user.isActive);
  }

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // ========================================
  // VERIFY PASSWORD
  // ========================================

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  // ========================================
  // DEBUG: PASSWORD VERIFICATION
  // ========================================

  console.log("[AUTH LOGIN] Password matches:", passwordMatches);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  // ========================================
  // CHECK ACCOUNT STATUS
  // ========================================

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated", 403);
  }

  // ========================================
  // ROLE-BASED LOGIN VALIDATION
  // ========================================

  console.log("[AUTH LOGIN] Requested account type:", data.accountType);

  if (
    data.accountType === "ADMIN" &&
    user.role !== "ADMIN"
  ) {
    throw new AppError("Invalid admin credentials", 403);
  }

  if (
    data.accountType === "CUSTOMER" &&
    user.role !== "CUSTOMER"
  ) {
    throw new AppError("Invalid customer credentials", 403);
  }

  // ========================================
  // GENERATE TOKEN
  // ========================================

  const token = generateToken(user);

  console.log("[AUTH LOGIN] Login successful:", user.email);

  return {
    user: formatUser(user),
    token,
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  registerUser,
  loginUser,
};


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
// REGISTER USER
// ========================================

async function registerUser(data) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
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
        email: data.email,
        passwordHash,
        phone: data.phone,

        // Never accept a public registration role from the client.
        role: "OPERATOR",
      },
    });

    const token = generateToken(user);

    return {
      user: formatUser(user),
      token,
    };
  } catch (error) {
    // Handle concurrent registration attempts.
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
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  // Use the same message for unknown emails and wrong passwords.
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated", 403);
  }

  const token = generateToken(user);

  return {
    user: formatUser(user),
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};

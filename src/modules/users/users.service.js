
const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");

// Fields safe to return to the client
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// ========================================
// GET CURRENT USER
// ========================================

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

// ========================================
// UPDATE OWN PROFILE
// ========================================

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: safeUserSelect,
  });

  return user;
}

// ========================================
// GET ALL USERS
// ========================================

async function getAllUsers({ page, limit, role, isActive }) {
  const skip = (page - 1) * limit;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========================================
// GET USER BY ID
// ========================================

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

// ========================================
// UPDATE ACCOUNT STATUS
// ========================================

async function updateUserStatus(userId, isActive, requesterId) {
  if (userId === requesterId && !isActive) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: safeUserSelect,
  });
}

// ========================================
// UPDATE USER ROLE
// ========================================

async function updateUserRole(userId, role, requesterId) {
  if (userId === requesterId) {
    throw new AppError("You cannot change your own role", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: safeUserSelect,
  });
}

module.exports = {
  getCurrentUser,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
};

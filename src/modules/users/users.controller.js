
const usersService = require("./users.service");

// GET /me
async function getMe(req, res) {
  const user = await usersService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

// PATCH /me
async function updateMe(req, res) {
  const user = await usersService.updateProfile(
    req.user.id,
    req.validatedBody
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
}

// GET /
async function getAllUsers(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await usersService.getAllUsers({
    page,
    limit,
    role: req.query.role,
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

// GET /:id
async function getUserById(req, res) {
  const user = await usersService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

// PATCH /:id/status
async function updateUserStatus(req, res) {
  const user = await usersService.updateUserStatus(
    req.params.id,
    req.validatedBody.isActive,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: { user },
  });
}

// PATCH /:id/role
async function updateUserRole(req, res) {
  const user = await usersService.updateUserRole(
    req.params.id,
    req.validatedBody.role,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: { user },
  });
}

module.exports = {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
};

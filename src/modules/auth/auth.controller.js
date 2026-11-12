
const authService = require("./auth.service");

// ========================================
// REGISTER
// ========================================

async function register(req, res) {
  const result = await authService.registerUser(
    req.validatedBody
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: result,
  });
}

// ========================================
// LOGIN
// ========================================

async function login(req, res) {
  const result = await authService.loginUser(
    req.validatedBody
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
}

module.exports = {
  register,
  login,
};

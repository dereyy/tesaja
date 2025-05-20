// controllers/UserController.js
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ValidationError, UniqueConstraintError } = require("sequelize");

// Utility for sending standardized error responses
function handleError(
  res,
  error,
  customMessage = "Internal server error",
  code = 500
) {
  console.error(`${customMessage}:`, error);
  return res.status(code).json({ status: "error", message: customMessage });
}

// GET all users
async function getUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "gender", "createdAt", "updatedAt"],
    });
    console.log("Fetched all users successfully");
    return res.status(200).json({ status: "success", data: users });
  } catch (error) {
    return handleError(res, error, "Failed to fetch users");
  }
}

// GET user by ID
async function getUserById(req, res) {
  const { id } = req.params;
  if (!id) {
    console.warn("User ID missing in request");
    return res
      .status(400)
      .json({ status: "failed", message: "User ID is required" });
  }
  try {
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email", "gender", "createdAt", "updatedAt"],
    });
    if (!user) {
      console.warn(`User not found: ID ${id}`);
      return res
        .status(404)
        .json({ status: "failed", message: "User not found" });
    }
    console.log(`Fetched user ID ${id} successfully`);
    return res.status(200).json({ status: "success", data: user });
  } catch (error) {
    return handleError(res, error, "Error retrieving user");
  }
}

// REGISTER new user
async function createUser(req, res) {
  const { name, email, gender, password } = req.body;

  // Input validation
  if (!name || !email || !gender || !password) {
    console.warn("CreateUser: missing fields", req.body);
    return res
      .status(400)
      .json({
        status: "failed",
        message: "All fields (name, email, gender, password) are required",
      });
  }
  try {
    const encryptedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      gender,
      password: encryptedPassword,
    });
    console.log(`User registered successfully: ID ${newUser.id}`);
    return res
      .status(201)
      .json({
        status: "success",
        message: "User registered successfully",
        data: { id: newUser.id, email: newUser.email },
      });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      console.warn("Register failed - email already in use:", email);
      return res
        .status(409)
        .json({ status: "failed", message: "Email already in use" });
    }
    if (error instanceof ValidationError) {
      console.warn("Register validation error:", error.message);
      return res.status(400).json({ status: "failed", message: error.message });
    }
    return handleError(res, error, "Failed to register user");
  }
}

// UPDATE user by ID
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, gender, password } = req.body;

  if (!id) {
    console.warn("UpdateUser: missing user ID");
    return res
      .status(400)
      .json({ status: "failed", message: "User ID is required" });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) {
      console.warn(`UpdateUser: user not found ID ${id}`);
      return res
        .status(404)
        .json({ status: "failed", message: "User not found" });
    }
    const updatedData = { name, email, gender };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }
    await user.update(updatedData);
    console.log(`User updated successfully: ID ${id}`);
    return res
      .status(200)
      .json({ status: "success", message: "User updated successfully" });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      console.warn("UpdateUser failed - email already in use:", email);
      return res
        .status(409)
        .json({ status: "failed", message: "Email already in use" });
    }
    return handleError(res, error, "Failed to update user");
  }
}

// DELETE user by ID
async function deleteUser(req, res) {
  const { id } = req.params;
  if (!id) {
    console.warn("DeleteUser: missing user ID");
    return res
      .status(400)
      .json({ status: "failed", message: "User ID is required" });
  }
  try {
    const deletedCount = await User.destroy({ where: { id } });
    if (deletedCount === 0) {
      console.warn(`DeleteUser: user not found ID ${id}`);
      return res
        .status(404)
        .json({ status: "failed", message: "User not found" });
    }
    console.log(`User deleted successfully: ID ${id}`);
    return res
      .status(200)
      .json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Failed to delete user");
  }
}

// LOGIN handler
async function loginHandler(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    console.warn("Login: missing email or password");
    return res
      .status(400)
      .json({ status: "failed", message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.warn(`Login failed - user not found: ${email}`);
      return res
        .status(401)
        .json({ status: "failed", message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.warn(`Login failed - invalid password for: ${email}`);
      return res
        .status(401)
        .json({ status: "failed", message: "Invalid email or password" });
    }

    const userData = user.toJSON();
    const { password: pwd, refresh_token, ...safeData } = userData;
    const accessToken = jwt.sign(safeData, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(safeData, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    await user.update({ refresh_token: refreshToken });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(`Login successful for user ID ${safeData.id}`);
    return res
      .status(200)
      .json({
        status: "success",
        message: "Login successful",
        data: { accessToken, user: safeData },
      });
  } catch (error) {
    return handleError(res, error, "Login failed");
  }
}

// LOGOUT handler
async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      console.warn("Logout: refresh token missing");
      return res
        .status(400)
        .json({ status: "failed", message: "Refresh token is missing" });
    }
    const user = await User.findOne({ where: { refresh_token: token } });
    if (!user) {
      console.warn("Logout failed - invalid refresh token");
      return res
        .status(403)
        .json({ status: "failed", message: "Invalid refresh token" });
    }
    await user.update({ refresh_token: null });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
    });
    console.log(`Logout successful for user ID ${user.id}`);
    return res
      .status(200)
      .json({ status: "success", message: "Logout successful" });
  } catch (error) {
    return handleError(res, error, "Logout failed");
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginHandler,
  logout,
};

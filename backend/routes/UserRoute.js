const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  loginHandler,
  logout
} = require('../controller/UserController.js');

const { refreshToken } = require('../controller/refreshToken.js');
const { verifyToken } = require('../middleware/VerifyToken.js');

// Routes
router.post('/refresh', refreshToken);
router.post('/login', loginHandler);
router.delete('/logout', logout);

router.post("/register", createUser);
router.get("/", verifyToken, getUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/edit-user/:id", verifyToken, updateUser);
router.delete("/delete-user/:id", deleteUser);

module.exports = router;

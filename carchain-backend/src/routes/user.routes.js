"use strict";

const { Router } = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
} = require("../controllers/user.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

// Public routes (no auth required)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (verifyJWT runs first)
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changePassword);

module.exports = router;
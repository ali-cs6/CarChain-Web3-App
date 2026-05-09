"use strict";

const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiErrors.js");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/user.model");

// Cookie options
const cookieOptions = {
  httpOnly: true, // not accessible via JS
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",
};

// Helper: generate both tokens and persist refreshToken in DB
const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// POST /api/v1/users/register
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password, governmentId, licenseNumber } =
    req.body;

  // 1. Required-field presence check
  if (
    [username, email, fullname, password, governmentId].some(
      (field) => !field || field.trim() === "",
    )
  ) {
    throw new ApiError(
      400,
      "username, email, fullname, password and governmentId are required",
    );
  }

  // 2. Duplicate check across all three unique fields
  const existingUser = await User.findOne({
    $or: [
      { username: username.trim().toLowerCase() },
      { email: email.trim().toLowerCase() },
      { governmentId: governmentId.trim() },
    ],
  });

  if (existingUser) {
    // Give a specific hint so the caller knows which field collided
    if (existingUser.username === username.trim().toLowerCase()) {
      throw new ApiError(409, "Username is already taken");
    }
    if (existingUser.email === email.trim().toLowerCase()) {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw new ApiError(409, "Government ID is already registered");
  }

  // 3. Create user — password hashing is handled by the pre-save hook
  const user = await User.create({
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    fullname: fullname.trim(),
    password,
    governmentId: governmentId.trim(),
    ...(licenseNumber && { licenseNumber: licenseNumber.trim() }),
  });

  // 4. Return the new user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// POST /api/v1/users/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Accept either email or username as the identifier
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user by whichever identifier was supplied
  const user = await User.findOne({
    $or: [
      ...(email ? [{ email: email.trim().toLowerCase() }] : []),
      ...(username ? [{ username: username.trim().toLowerCase() }] : []),
    ],
  });

  if (!user) {
    throw new ApiError(404, "No account found with those credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully",
      ),
    );
});

// POST /api/v1/users/logout (protected — requires auth middleware)
const logoutUser = asyncHandler(async (req, res) => {
  // Clear the refreshToken stored in the DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } }, // $unset removes the field cleanly
    { new: true },
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// POST /api/v1/users/refresh-token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Accept token from cookie (browser) or body (mobile apps)
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(401, "User belonging to this token no longer exists");
  }

  // Ensure the token matches what is stored — detects token reuse after logout
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(
      401,
      "Refresh token has already been used or is invalid",
    );
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    user._id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed successfully",
      ),
    );
});

// GET /api/v1/users/me (protected — requires auth middleware)
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is attached by the auth middleware (password & token already excluded)
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// change current password (protected — requires auth middleware)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // authanticated user via auth.middleware
  const user = await User.findById(req.user?._id);
  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }
  
  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});


module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
};

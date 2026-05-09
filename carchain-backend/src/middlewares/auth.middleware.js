const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiErrors.js");
const User = require("../models/user.model.js");
const { asyncHandler } = require("../utils/asyncHandler.js");


const verifyJWT = asyncHandler(async(req, _, next) => {
  const token = req.cookies.accessToken || req.header("Authorization")
  // .replace("Bearer", "")
  if(!token) {
    throw new ApiError(401, "Authontication token missing")
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if (!user) {
      throw new ApiError(401, "Invalid access token or user not found")
    }
    //custom prop in req
    //this user is authunticated
    req.user = user
    //passing on the context
    next()

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access token")
  }
});

module.exports = { verifyJWT };
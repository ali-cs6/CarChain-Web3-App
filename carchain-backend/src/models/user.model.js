// const mongoose, { Schema } = require("mongoose");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, //provide indexing too
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    governmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

//pre hook to encrypt password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // if password is not modified, skip hashing

  this.password = await bcrypt.hash(this.password, 10);
});

//checking input password while login
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// for user to access
userSchema.methods.generateAccessToken = function () {
  // short lived accessToken (used for authentication, stored in client side memory)
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      governmentId: this.governmentId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};
userSchema.methods.generateRefreshToken = function () {
  // long lived accessToken (stored in DB)
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

const User = mongoose.model("User", userSchema);
module.exports = User;

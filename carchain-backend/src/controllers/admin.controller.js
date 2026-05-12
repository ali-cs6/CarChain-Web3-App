"use strict";

const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiErrors.js");
const { ApiResponse } = require("../utils/ApiResponse");
const fabricService = require("../services/fabric.services.js");
const AuditLog = require("../models/auditlog.model.js");
const User = require("../models/user.model");

// POST /api/v1/admin/init-ledger
// Dangerous: overwrites existing ledger state with seed data.
// Double-guarded: verifyJWT + requireAdmin both run before this.
const initLedger = asyncHandler(async (req, res) => {
  // Extra runtime guard — should never reach here without admin role
  // but we never rely solely on middleware for destructive operations
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Forbidden: admin access required");
  }

  const result = await fabricService.initLedger();

  // Audit log the initLedger — this is the most critical action in the system
  await AuditLog.create({
    userId: req.user._id,
    action: "initLedger",
    vehicleId: null,
    fabricTxId: result?.transactionId || null,
    payload: {},
    response: result,
    error: null,
    status: "success",
    ipAddress:
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      null,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Ledger initialized successfully"));
});

// GET /api/v1/admin/audit-logs
// Returns paginated audit logs — essential for admins to monitor activity.
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  // Optional filters from query string
  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.status) filter.status = req.query.status;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("userId", "username email fullname role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Audit logs fetched successfully",
    ),
  );
});

// GET /api/v1/admin/users
// Returns all registered users — admin needs visibility over who has access.
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Users fetched successfully",
    ),
  );
});

module.exports = { initLedger, getAuditLogs, getAllUsers };

"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for unauthenticated calls (shouldn't happen but safe)
    },
    action: {
      type: String,
      required: true,
      enum: [
        "getAllVehicles",
        "getVehicleById",
        "getVehiclesByOwner",
        "getVehicleHistory",
        "verifyVehicle",
        "registerVehicle",
        "transferOwnership",
        "updateVehicleStatus",
      ],
    },
    vehicleId: {
      type: String,
      default: null,
    },
    fabricTxId: {
      type: String,
      default: null, // only present on submit transactions (POST/PUT)
    },
    payload: {
      type: Schema.Types.Mixed, // req.body or req.params recieved
      default: {},
    },
    response: {
      type: Schema.Types.Mixed, // what was returned to the client
      default: null,
    },
    error: {
      type: String,
      default: null, // error message if the call failed
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = the log timestamp
  }
);

// Index for common query patterns:
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ vehicleId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ status: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
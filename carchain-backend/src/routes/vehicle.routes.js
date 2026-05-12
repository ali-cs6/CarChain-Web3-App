"use strict";

const { Router } = require("express");
const {
  getAllVehicles,
  getVehicleById,
  getVehicleHistory,
  getVehiclesByOwner,
  verifyVehicle,
  registerVehicle,
  transferOwnership,
  updateVehicleStatus,
} = require("../controllers/vehicle.controller.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { auditLog } = require("../middlewares/audit.middleware.js");

const router = Router();


// router.use(verifyJWT);

// Queries (GET)
router.get("/", getAllVehicles);
router.get("/owner/:owner", getVehiclesByOwner);
router.get("/:vehicleId", getVehicleById);
router.get("/:vehicleId/history", getVehicleHistory);
router.get("/:vehicleId/verify", verifyVehicle);

// Invokes (POST / PUT)
router.post("/", verifyJWT, auditLog("registerVehicle"), registerVehicle);
router.put("/:vehicleId/transfer", verifyJWT, auditLog("transferOwnership"), transferOwnership);
router.put("/:vehicleId/status", verifyJWT, auditLog("updateVehicleStatus"), updateVehicleStatus);

module.exports = router;

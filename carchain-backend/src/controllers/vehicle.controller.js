"use strict";

const fabricService = require("../services/fabric.services.js");
const { ApiError } = require("../utils/ApiErrors.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

// GET /api/v1/vehicles
const getAllVehicles = asyncHandler(async (req, res) => {
  const vehicles = await fabricService.getAllVehicles();
  return res
    .status(200)
    .json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));
});

// GET /api/v1/vehicles/:vehicleId
const getVehicleById = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const vehicle = await fabricService.queryVehicle(vehicleId);
  return res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle fetched successfully"));
});

// GET /api/v1/vehicles/:vehicleId/history
const getVehicleHistory = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const history = await fabricService.getVehicleHistory(vehicleId);
  if (history.length === 0) {
    throw new ApiError(404, `No history found for vehicle: ${vehicleId}`);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, history, "Vehicle history fetched successfully"));
});

// GET /api/v1/vehicles/owner/:owner
const getVehiclesByOwner = asyncHandler(async (req, res) => {
  const { owner } = req.params;
  const vehicles = await fabricService.getVehiclesByOwner(owner);
  if (vehicles.length === 0) {
    throw new ApiError(404, `No vehicles found for owner: ${owner}`);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));
});

// GET /api/v1/vehicles/:vehicleId/verify
const verifyVehicle = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const result = await fabricService.verifyVehicle(vehicleId);
  if(result.exists === false) {
    throw new ApiError(404, `Vehicle ${vehicleId} does not exist`);
  };
  console.log(result);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Vehicle verified successfully"));
});

// POST /api/v1/vehicles
const registerVehicle = asyncHandler(async (req, res) => {
  const { vehicleId, make, model, year, color, owner } = req.body;

  if (
    [vehicleId, make, model, year, color, owner].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(
      400,
      "vehicleId, make, model, year, color and owner are all required"
    );
  }

  const vehicle = await fabricService.registerVehicle(
    vehicleId.trim(),
    make.trim(),
    model.trim(),
    year.trim(),
    color.trim(),
    owner.trim()
  );

  return res
    .status(201)
    .json(new ApiResponse(201, vehicle, "Vehicle registered successfully"));
});

// PUT /api/v1/vehicles/:vehicleId/transfer
const transferOwnership = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { newOwner } = req.body;

  if (!newOwner || newOwner.trim() === "") {
    throw new ApiError(400, "newOwner is required");
  }

  const vehicle = await fabricService.transferOwnership(
    vehicleId,
    newOwner.trim()
  );

  return res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Ownership transferred successfully"));
});

// PUT /api/v1/vehicles/:vehicleId/status
const updateVehicleStatus = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { status } = req.body;

  const validStatuses = ["active", "stolen", "scrapped", "removed"];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `status is required and must be one of: ${validStatuses.join(", ")}`
    );
  }

  const vehicle = await fabricService.updateVehicleStatus(vehicleId, status);

  return res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle status updated successfully"));
});

module.exports = {
  getAllVehicles,
  getVehicleById,
  getVehicleHistory,
  getVehiclesByOwner,
  verifyVehicle,
  registerVehicle,
  transferOwnership,
  updateVehicleStatus,
};
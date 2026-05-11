"use strict";

const { getContract } = require("../utils/fabricUtils.js");
const { ApiError } = require("../utils/ApiErrors.js");

// Helper: decode Uint8Array result to parsed JSON
function decode(result) {
  return JSON.parse(Buffer.from(result).toString());
}

// Helper: extract a clean message from chaincode errors
function chaincodeError(fnName, err) {
  // Fabric wraps chaincode errors — the actual message is buried in details
  const message =
    err?.details?.[0]?.message ||
    err?.message ||
    `Chaincode error in ${fnName}`;

  // Strip gRPC status prefix if present e.g. "2 UNKNOWN: ..."
  const clean = message.replace(/^\d+ \w+: /, "").trim();

  // Map common chaincode error patterns to HTTP status codes
  if (/already exists/i.test(clean)) throw new ApiError(409, clean);
  if (/does not exist/i.test(clean)) throw new ApiError(404, clean);
  if (/not active/i.test(clean)) throw new ApiError(422, clean);
  if (/invalid status/i.test(clean)) throw new ApiError(400, clean);

  throw new ApiError(500, clean);
}

// QUERIES  (evaluate — read-only, no transaction committed)

/**
 * Get all vehicles on the ledger.
 * @returns {Promise<Array>}
 */
async function getAllVehicles() {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction("getAllVehicles");
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("getAllVehicles", err);
  }
}

/**
 * Query a single vehicle by its ID.
 * @param {string} vehicleId
 * @returns {Promise<Object>}
 */
async function queryVehicle(vehicleId) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "queryVehicle",
      vehicleId,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("queryVehicle", err);
  }
}

/**
 * Get all vehicles owned by a specific owner name.
 * @param {string} owner
 * @returns {Promise<Array>}
 */
async function getVehiclesByOwner(owner) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "getVehiclesByOwner",
      owner,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("getVehiclesByOwner", err);
  }
}

/**
 * Get the full transaction history for a vehicle.
 * @param {string} vehicleId
 * @returns {Promise<Array>}
 */
async function getVehicleHistory(vehicleId) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "getVehicleHistory",
      vehicleId,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("getVehicleHistory", err);
  }
}

/**
 * Verify whether a vehicle exists and return its basic info.
 * @param {string} vehicleId
 * @returns {Promise<{ exists: boolean, status: string|null, owner: string|null }>}
 */
async function verifyVehicle(vehicleId) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "verifyVehicle",
      vehicleId,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("verifyVehicle", err);
  }
}

// SUBMITS  (submitTransaction — write, creates a block on the ledger)
/**
 * Register a new vehicle on the ledger.
 * @param {string} vehicleId
 * @param {string} make
 * @param {string} model
 * @param {string} year
 * @param {string} color
 * @param {string} owner
 * @returns {Promise<Object>} the created vehicle
 */
async function registerVehicle(vehicleId, make, model, year, color, owner) {
  try {
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "registerVehicle",
      vehicleId,
      make,
      model,
      year,
      color,
      owner,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("registerVehicle", err);
  }
}

/**
 * Transfer ownership of a vehicle to a new owner.
 * @param {string} vehicleId
 * @param {string} newOwner
 * @returns {Promise<Object>} the updated vehicle
 */
async function transferOwnership(vehicleId, newOwner) {
  try {
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "transferOwnership",
      vehicleId,
      newOwner,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("transferOwnership", err);
  }
}

/**
 * Update the status of a vehicle (active | stolen | scrapped | removed).
 * @param {string} vehicleId
 * @param {string} newStatus
 * @returns {Promise<Object>} the updated vehicle
 */
async function updateVehicleStatus(vehicleId, newStatus) {
  try {
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "updateVehicleStatus",
      vehicleId,
      newStatus,
    );
    return decode(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    chaincodeError("updateVehicleStatus", err);
  }
}

module.exports = {
  // queries
  getAllVehicles,
  queryVehicle,
  getVehiclesByOwner,
  getVehicleHistory,
  verifyVehicle,
  // submits
  registerVehicle,
  transferOwnership,
  updateVehicleStatus,
};

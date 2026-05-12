"use strict";

const AuditLog = require("../models/auditlog.model.js");

// Helper: extract vehicleId from request (params take priority over body)
function extractVehicleId(req) {
  return req.params?.vehicleId || req.body?.vehicleId || null;
}

// Helper: extract IP, respecting proxies
function extractIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// Helper: extract Fabric transaction ID from a submit response
// fabric-gateway returns transactionId on the result object for submits.
// For evaluate (queries) there is no txId — we leave it null.
function extractFabricTxId(responseData) {
  if (!responseData) return null;
  // If the service returned the raw vehicle object it won't have a txId,
  // but if someone enriches the response later this handles it gracefully.
  return responseData?.transactionId || responseData?.txId || null;
}

// Helper: build payload from request
function buildPayload(req) {
  return {
    params: req.params || {},
    body: req.body || {},
    query: req.query || {},
  };
}

// Core: persist the audit log (fire-and-forget, never blocks the response)
async function persistLog(entry) {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    // Logging must never crash the app — just warn to console
    console.warn("[AuditLog] Failed to persist audit log:", err.message);
  }
}

// auditLog(action)
//
// Usage in routes:
//   router.get("/", auditLog("getAllVehicles"), getAllVehicles);
//
// It wraps the response via res.json() monkey-patching so we capture
// whatever the controller actually sends back — without touching controller code.
function auditLog(action) {
  return async (req, res, next) => {
    const startedAt = Date.now();
    const originalJson = res.json.bind(res);

    // Intercept res.json to capture the outgoing response body
    res.json = function (body) {
      const isSuccess = res.statusCode < 400;
      const responseData = body?.data ?? body;

      // Fire-and-forget — do not await so response is never delayed
      persistLog({
        userId: req.user?._id || null,
        action,
        vehicleId: extractVehicleId(req),
        fabricTxId: isSuccess ? extractFabricTxId(responseData) : null,
        payload: buildPayload(req),
        response: isSuccess ? responseData : null,
        error: !isSuccess ? body?.message || "Unknown error" : null,
        status: isSuccess ? "success" : "failure",
        ipAddress: extractIp(req),
      });

      // Call original res.json — response goes to client immediately
      return originalJson(body);
    };

    // Also capture errors thrown via next(err) / asyncHandler
    const originalNext = next;
    const wrappedNext = async (err) => {
      if (err) {
        await persistLog({
          userId: req.user?._id || null,
          action,
          vehicleId: extractVehicleId(req),
          fabricTxId: null,
          payload: buildPayload(req),
          response: null,
          error: err?.message || "Unknown error",
          status: "failure",
          ipAddress: extractIp(req),
        });
      }
      originalNext(err);
    };

    next = wrappedNext;
    next();
  };
}

module.exports = { auditLog };

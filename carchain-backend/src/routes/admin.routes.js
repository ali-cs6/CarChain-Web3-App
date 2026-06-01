"use strict";

const { Router } = require("express");
const { verifyJWT, requireAdmin } = require("../middlewares/auth.middleware.js");
const {
  initLedger,
  getAuditLogs,
  getAllUsers,
  updateUserVerification,
} = require("../controllers/admin.controller.js");

const router = Router();

// All admin routes require both valid JWT and admin role
router.use(verifyJWT, requireAdmin);

router.post("/init-ledger", initLedger);
router.get("/audit-logs", getAuditLogs);
router.get("/users", getAllUsers);
router.patch("/users/:userId/verification", updateUserVerification);

module.exports = router;

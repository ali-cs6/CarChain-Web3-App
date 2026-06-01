"use strict";

const { Router }                  = require("express");
const { verifyJWT }               = require("../middlewares/auth.middleware");
const { completeSale, getMySales } = require("../controllers/sale.controller");

const router = Router();

// All sale routes require a valid session
router.use(verifyJWT);

router.get("/my-sales",              getMySales);
router.post("/:vehicleId/complete",  completeSale);

module.exports = router;

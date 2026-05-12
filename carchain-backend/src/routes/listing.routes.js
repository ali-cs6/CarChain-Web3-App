"use strict";

const { Router } = require("express");
const {
  getListings,
  getListingByVehicleId,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listing.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

// Public routes
router.get("/", getListings);
router.get("/:vehicleId", getListingByVehicleId);

// Protected routes
router.post("/", verifyJWT, createListing);
router.patch("/:vehicleId", verifyJWT, updateListing);
router.delete("/:vehicleId", verifyJWT, deleteListing);

module.exports = router;

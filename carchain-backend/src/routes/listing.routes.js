"use strict";

const { Router } = require("express");
const {
  getListings,
  getListingByVehicleId,
  createListing,
  updateListing,
  deleteListing,
  uploadPhotos,
} = require("../controllers/listing.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

// Public routes
router.get("/", getListings);
router.get("/:vehicleId", getListingByVehicleId);

// Protected routes
router.post("/", verifyJWT, createListing);
router.patch("/:vehicleId", verifyJWT, updateListing);
router.delete("/:vehicleId", verifyJWT, deleteListing);
router.post("/:vehicleId/photos", verifyJWT, upload.array("photos", 5), uploadPhotos);

module.exports = router;

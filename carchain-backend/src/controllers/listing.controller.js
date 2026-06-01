"use strict";

const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiErrors");
const { ApiResponse } = require("../utils/ApiResponse");
const Listing = require("../models/listing.model");
const fabricService = require("../services/fabric.services");
const { uploadToCloudinary } = require("../configs/cloudinary.config");

// GET /api/v1/listings  — public
const getListings = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { isForSale: true };

  if (req.query.make) filter.make = { $regex: req.query.make, $options: "i" };
  if (req.query.model)
    filter.model = { $regex: req.query.model, $options: "i" };
  if (req.query.location)
    filter.location = { $regex: req.query.location, $options: "i" };
  if (req.query.year) filter.year = req.query.year;

  if (req.query.minYear || req.query.maxYear) {
    filter.year = {};
    if (req.query.minYear) filter.year.$gte = req.query.minYear;
    if (req.query.maxYear) filter.year.$lte = req.query.maxYear;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  const sortField = req.query.sortBy || "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate("sellerId", "username fullname")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Listing.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        listings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Listings fetched successfully",
    ),
  );
});

// GET /api/v1/listings/:vehicleId  — public
const getListingByVehicleId = asyncHandler(async (req, res) => {
  const listing = await Listing.findOneAndUpdate(
    { vehicleId: req.params.vehicleId },
    { $inc: { views: 1 } },
    { new: true },
  ).populate("sellerId", "username fullname");

  if (!listing) throw new ApiError(404, "Listing not found");

  return res
    .status(200)
    .json(new ApiResponse(200, listing, "Listing fetched successfully"));
});

// POST /api/v1/listings  — auth required
const createListing = asyncHandler(async (req, res) => {
  const { vehicleId, price, location, mileage, description, contactNumber } = req.body;

  if (!vehicleId || price == null || !location || mileage == null || !contactNumber) {
    throw new ApiError(
      400,
      "vehicleId, price, location, mileage, and contactNumber are required",
    );
  }

  // Verify vehicle exists on the ledger and is active
  const vehicle = await fabricService.queryVehicle(vehicleId);
  if (!vehicle) throw new ApiError(404, "Vehicle not found on the ledger");
  if (vehicle.status !== "active") {
    throw new ApiError(
      422,
      `Vehicle status is "${vehicle.status}" — only active vehicles can be listed`,
    );
  }

  // Check no duplicate active listing exists
  const existing = await Listing.findOne({ vehicleId, isForSale: true });
  if (existing)
    throw new ApiError(
      409,
      "An active listing already exists for this vehicle",
    );

  const listing = await Listing.create({
    vehicleId,
    sellerId: req.user._id,
    price,
    location,
    mileage,
    description: description || "",
    contactNumber: contactNumber.trim(),
    // Denormalize vehicle metadata from the ledger for fast filtering
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, listing, "Listing created successfully"));
});

// PATCH /api/v1/listings/:vehicleId  — auth, seller only
const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ vehicleId: req.params.vehicleId });

  if (!listing) throw new ApiError(404, "Listing not found");
  if (!listing.sellerId.equals(req.user._id)) {
    throw new ApiError(403, "You are not the seller of this listing");
  }

  const allowed = ["price", "location", "mileage", "description", "isForSale", "photos", "contactNumber"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) listing[field] = req.body[field];
  });

  await listing.save();

  return res
    .status(200)
    .json(new ApiResponse(200, listing, "Listing updated successfully"));
});

// DELETE /api/v1/listings/:vehicleId  — auth, seller only
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ vehicleId: req.params.vehicleId });

  if (!listing) throw new ApiError(404, "Listing not found");
  if (!listing.sellerId.equals(req.user._id)) {
    throw new ApiError(403, "You are not the seller of this listing");
  }

  await listing.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Listing deleted successfully"));
});

// POST /api/v1/listings/:vehicleId/photos  — auth, seller only, max 5 photos
const uploadPhotos = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No images provided");
  }

  const listing = await Listing.findOne({ vehicleId: req.params.vehicleId });
  if (!listing) throw new ApiError(404, "Listing not found");
  if (!listing.sellerId.equals(req.user._id)) {
    throw new ApiError(403, "You are not the seller of this listing");
  }

  const remaining = 5 - listing.photos.length;
  if (remaining <= 0) {
    throw new ApiError(400, "Maximum of 5 photos per listing already reached");
  }

  const filesToUpload = req.files.slice(0, remaining);

  const urls = await Promise.all(
    filesToUpload.map((file) => uploadToCloudinary(file.buffer)),
  );

  listing.photos.push(...urls);
  await listing.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        listing,
        `${urls.length} photo(s) uploaded successfully`,
      ),
    );
});

module.exports = {
  getListings,
  getListingByVehicleId,
  createListing,
  updateListing,
  deleteListing,
  uploadPhotos,
};

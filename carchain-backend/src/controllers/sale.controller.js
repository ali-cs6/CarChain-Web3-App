"use strict";

const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError }     = require("../utils/ApiErrors");
const { ApiResponse }  = require("../utils/ApiResponse");
const fabricService    = require("../services/fabric.services");
const Listing          = require("../models/listing.model");
const Sale             = require("../models/sale.model");
const AuditLog         = require("../models/auditlog.model");
const User             = require("../models/user.model");

// POST /api/v1/sales/:vehicleId/complete
// Seller-only. Resolves buyer from the platform, transfers blockchain ownership,
// hands the listing over to the buyer, and records the sale.
const completeSale = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { buyerIdentifier, salePrice } = req.body;

  if (!buyerIdentifier?.trim()) {
    throw new ApiError(400, "buyerIdentifier (username or email) is required");
  }
  if (salePrice == null || Number(salePrice) < 0) {
    throw new ApiError(400, "salePrice must be a non-negative number");
  }

  // Resolve the buyer — must be a registered platform user
  const identifier = buyerIdentifier.trim().toLowerCase();
  const buyer = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  }).select("_id fullname username email");

  if (!buyer) {
    throw new ApiError(
      404,
      `No registered user found with username or email "${buyerIdentifier.trim()}"`,
    );
  }

  // Verify the listing exists and the caller is the current seller
  const listing = await Listing.findOne({ vehicleId });
  if (!listing) throw new ApiError(404, "Listing not found");
  if (!listing.sellerId.equals(req.user._id)) {
    throw new ApiError(403, "Only the current seller can complete this sale");
  }
  if (listing.sellerId.equals(buyer._id)) {
    throw new ApiError(400, "You cannot sell a vehicle to yourself");
  }
  if (!listing.isForSale) {
    throw new ApiError(409, "This listing has already been marked as sold");
  }

  // Transfer ownership on the blockchain using the buyer's registered full name
  const transferResult = await fabricService.transferOwnership(vehicleId, buyer.fullname);
  const fabricTxId = transferResult?.transactionId || null;

  // Close the listing AND hand its ownership to the buyer on the platform.
  // This prevents the original seller from re-listing or editing the vehicle,
  // and lets the buyer manage it from their own dashboard.
  listing.isForSale = false;
  listing.sellerId  = buyer._id;
  await listing.save();

  // Persist the sale record
  const sale = await Sale.create({
    vehicleId,
    sellerId:  req.user._id,
    buyerId:   buyer._id,
    buyerName: buyer.fullname,
    salePrice: Number(salePrice),
    fabricTxId,
    make:  listing.make,
    model: listing.model,
    year:  listing.year,
    color: listing.color,
  });

  // Audit trail
  await AuditLog.create({
    userId:    req.user._id,
    action:    "completeSale",
    vehicleId,
    fabricTxId,
    payload:   { buyerIdentifier: identifier, salePrice: Number(salePrice) },
    response:  { saleId: sale._id, buyerId: buyer._id, fabricTxId },
    error:     null,
    status:    "success",
    ipAddress:
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      null,
  });

  return res.status(201).json(
    new ApiResponse(201, { sale }, "Sale completed — ownership transferred on blockchain"),
  );
});

// GET /api/v1/sales/my-sales
// Returns the authenticated seller's completed sale history.
const getMySales = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    Sale.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Sale.countDocuments({ sellerId: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      sales,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, "Sales fetched successfully"),
  );
});

module.exports = { completeSale, getMySales };

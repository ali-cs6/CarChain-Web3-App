"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const listingSchema = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true, // one active listing per vehicle
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    mileage: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    photos: {
      type: [String], // array of URLs (Cloudinary or local)
      default: [],
    },
    isForSale: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    // Denormalized from Fabric for filtering without hitting the ledger on every query
    make: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true },
);

// Indexes for common filter/search patterns
listingSchema.index({ isForSale: 1, createdAt: -1 });
listingSchema.index({ sellerId: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ make: 1, model: 1, year: 1 });
listingSchema.index({ location: 1 });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

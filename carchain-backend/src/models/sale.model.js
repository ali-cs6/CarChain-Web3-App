"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const saleSchema = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    fabricTxId: {
      type: String,
      default: null,
    },
    // Denormalized from listing for fast display without extra joins
    make:  { type: String, trim: true },
    model: { type: String, trim: true },
    year:  { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true },
);

saleSchema.index({ sellerId: 1, createdAt: -1 });
saleSchema.index({ buyerId:  1, createdAt: -1 });
saleSchema.index({ vehicleId: 1 });

const Sale = mongoose.model("Sale", saleSchema);
module.exports = Sale;

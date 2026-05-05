"use strict";

const { Contract } = require("fabric-contract-api");

class CarChainChainCode extends Contract {
  // Initialize ledger with sample vehicles
  async initLedger(ctx) {
    const mspId = ctx.clientIdentity.getMSPID();

    const vehicles = [
      {
        vehicleId: "VH001",
        make: "Toyota",
        model: "Corolla",
        year: "2022",
        color: "White",
        owner: "Ali Hassan",
        registeredBy: mspId,
        status: "active",
        timestamp: new Date(
          ctx.stub.getTxTimestamp().seconds.low * 1000,
        ).toISOString(), // Convert protobuf timestamp to ISO string
      },
      {
        vehicleId: "VH002",
        make: "Honda",
        model: "Civic",
        year: "2021",
        color: "Black",
        owner: "Sara Khan",
        registeredBy: mspId,
        status: "active",
        timestamp: new Date(
          ctx.stub.getTxTimestamp().seconds.low * 1000,
        ).toISOString(),
      },
    ];

    for (const vehicle of vehicles) {
      await ctx.stub.putState(
        vehicle.vehicleId,
        Buffer.from(JSON.stringify(vehicle)),
      );
      console.log(`Vehicle ${vehicle.vehicleId} initialized on ledger`);
    }
  }

  // Register a new vehicle
  async registerVehicle(ctx, vehicleId, make, model, year, color, owner) {
    const existing = await ctx.stub.getState(vehicleId);
    if (existing && existing.length > 0) {
      throw new Error(`Vehicle ${vehicleId} already exists on the ledger`);
    }

    const mspId = ctx.clientIdentity.getMSPID();

    const vehicle = {
      vehicleId,
      make,
      model,
      year,
      color,
      owner,
      registeredBy: mspId,
      status: "active",
      timestamp: new Date(
        ctx.stub.getTxTimestamp().seconds.low * 1000,
      ).toISOString(),
    };

    await ctx.stub.putState(vehicleId, Buffer.from(JSON.stringify(vehicle)));

    // Emit event so applications can listen for new registrations
    ctx.stub.setEvent(
      "VehicleRegistered",
      Buffer.from(JSON.stringify({ vehicleId, owner, mspId })),
    );

    console.log(`Vehicle ${vehicleId} registered by ${mspId}`);
    return JSON.stringify(vehicle);
  }

  // Query a single vehicle by ID
  async queryVehicle(ctx, vehicleId) {
    const vehicleBytes = await ctx.stub.getState(vehicleId);

    if (!vehicleBytes || vehicleBytes.length === 0) {
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }

    return vehicleBytes.toString();
  }

  // Transfer vehicle ownership
  async transferOwnership(ctx, vehicleId, newOwner) {
    const vehicleBytes = await ctx.stub.getState(vehicleId);

    if (!vehicleBytes || vehicleBytes.length === 0) {
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }

    const vehicle = JSON.parse(vehicleBytes.toString());

    if (vehicle.status !== "active") {
      throw new Error(
        `Vehicle ${vehicleId} is not active. Current status: ${vehicle.status}`,
      );
    }

    const previousOwner = vehicle.owner;
    vehicle.owner = newOwner;
    vehicle.timestamp = new Date(
      ctx.stub.getTxTimestamp().seconds.low * 1000,
    ).toISOString();

    await ctx.stub.putState(vehicleId, Buffer.from(JSON.stringify(vehicle)));

    // Emit event for ownership transfer
    ctx.stub.setEvent(
      "OwnershipTransferred",
      Buffer.from(
        JSON.stringify({
          vehicleId,
          previousOwner,
          newOwner,
          timestamp: vehicle.timestamp,
        }),
      ),
    );

    console.log(
      `Vehicle ${vehicleId} transferred from ${previousOwner} to ${newOwner}`,
    );
    return JSON.stringify(vehicle);
  }

  // Get all vehicles on the ledger
  async getAllVehicles(ctx) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const vehicles = [];

    let result = await iterator.next();
    while (!result.done) {
      const vehicle = JSON.parse(result.value.value.toString("utf8"));
      vehicles.push(vehicle);
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(vehicles);
  }

  // Get all vehicles owned by a specific owner
  async getVehiclesByOwner(ctx, owner) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const vehicles = [];

    let result = await iterator.next();
    while (!result.done) {
      const vehicle = JSON.parse(result.value.value.toString("utf8"));
      if (vehicle.owner === owner) {
        vehicles.push(vehicle);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(vehicles);
  }

  // Get full transaction history of a vehicle
  async getVehicleHistory(ctx, vehicleId) {
    const iterator = await ctx.stub.getHistoryForKey(vehicleId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
        data: result.value.value.toString("utf8"),
      };
      history.push(record);
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(history);
  }

  // Update vehicle status
  async updateVehicleStatus(ctx, vehicleId, newStatus) {
    const validStatuses = ["active", "stolen", "scrapped", "removed"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const vehicleBytes = await ctx.stub.getState(vehicleId);
    if (!vehicleBytes || vehicleBytes.length === 0) {
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }

    const vehicle = JSON.parse(vehicleBytes.toString());
    const previousStatus = vehicle.status;
    vehicle.status = newStatus;
    vehicle.timestamp = new Date(
      ctx.stub.getTxTimestamp().seconds.low * 1000,
    ).toISOString();

    await ctx.stub.putState(vehicleId, Buffer.from(JSON.stringify(vehicle)));

    ctx.stub.setEvent(
      "VehicleStatusUpdated",
      Buffer.from(
        JSON.stringify({
          vehicleId,
          previousStatus,
          newStatus,
          timestamp: vehicle.timestamp,
        }),
      ),
    );

    return JSON.stringify(vehicle);
  }

  // Verify vehicle exists and return basic info
  async verifyVehicle(ctx, vehicleId) {
    const vehicleBytes = await ctx.stub.getState(vehicleId);

    if (!vehicleBytes || vehicleBytes.length === 0) {
      return JSON.stringify({ exists: false, status: null, owner: null });
    }

    const vehicle = JSON.parse(vehicleBytes.toString());
    return JSON.stringify({
      exists: true,
      status: vehicle.status,
      owner: vehicle.owner,
    });
  }
}

module.exports = CarChainChainCode;

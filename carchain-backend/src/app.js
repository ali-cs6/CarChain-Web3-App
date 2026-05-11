const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user.routes.js");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// Test route to verify Fabric connection and query
const fabricService = require("./services/fabric.services.js");
app.get("/api/v1/fabric-test", async (req, res) => {
  const vehicles = await fabricService.getAllVehicles();
  res.json(vehicles);
});




module.exports = app;
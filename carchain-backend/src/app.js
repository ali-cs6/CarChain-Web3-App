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

// vehicle routes
const vehicleRouter = require("./routes/vehicle.routes");
app.use("/api/v1/vehicles", vehicleRouter);




module.exports = app;
// const {ApiError} = require('./utils/ApiErrors.js');
// console.log("index.js is running");
// console.log(new ApiError(404, "Not found", [], "Stack trace example"));

require("dotenv").config();

const connectDB = require("./db/index.js");

connectDB();
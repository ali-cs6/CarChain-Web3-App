const app = require("./app.js");
const connectDB = require("./db/index.js");

require("dotenv").config();

const PORT = process.env.PORT || 8000;

// Connect to the database
connectDB().then(() => {
  // Start the server after successful DB connection
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to connect to the database:", error);
});

// Graceful shutdown on SIGTERM/SIGINT
const { closeGateway } = require("./utils/fabricUtils.js");
process.on("SIGTERM", () => { closeGateway(); process.exit(0); });
process.on("SIGINT",  () => { closeGateway(); process.exit(0); });
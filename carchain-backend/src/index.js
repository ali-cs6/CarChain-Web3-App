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
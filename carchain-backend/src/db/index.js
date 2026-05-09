const {mongoose} = require('mongoose');
const {DB_NAME} = require('../constants.js');

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    console.log(`\nMongoDB connected: ${connectionInstance.connection.host}/${DB_NAME}`);
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process with an error code
  }
};

module.exports = connectDB;
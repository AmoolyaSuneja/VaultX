const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'secure_vault'
    });
    const { host, name } = mongoose.connection;
    console.log(`MongoDB connected successfully to "${name}" on "${host}"`);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  
  console.log('MONGO_URI VALUE:', process.env.MONGO_URI);

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

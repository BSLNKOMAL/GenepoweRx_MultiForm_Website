const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("ENV MONGO_URI:", process.env.MONGO_URI); // ✅ ADD THIS

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      bufferCommands: false,
      maxPoolSize: 10
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('DB Error:', error.message);
    
  }
};

module.exports = connectDB;

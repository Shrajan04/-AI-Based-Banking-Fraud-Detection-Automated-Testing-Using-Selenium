const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB: ${uri}`);
  } catch (err) {
    console.error('[DB] Could not connect to MongoDB.');
    console.error('     Make sure MongoDB is running and MONGO_URI in backend/.env is correct.');
    console.error('     Error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

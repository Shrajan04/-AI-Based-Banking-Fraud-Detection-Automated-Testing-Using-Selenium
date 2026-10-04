/**
 * Seeds the database with demo users and transactions.
 * Usage (from the backend folder):  npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { seedDatabase, USERS } = require('./seedData');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banking_fraud_db';
  await connectDB(uri);
  const summary = await seedDatabase();
  console.log('[SEED] Done:', summary);
  console.log('[SEED] Login accounts:');
  USERS.forEach((u) => console.log(`   ${u.username.padEnd(11)} / ${u.password.padEnd(11)} account ${u.accountNumber}  balance Rs.${u.balance}`));
  await mongoose.disconnect();
})();

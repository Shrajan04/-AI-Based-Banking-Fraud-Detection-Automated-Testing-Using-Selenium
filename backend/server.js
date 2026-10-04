/**
 * AI-Based Banking Fraud Detection & Automated Testing Using Selenium
 * Backend entry point.
 *
 * One Express server does two jobs:
 *   1. REST API under /api/...
 *   2. Serves the frontend HTML/CSS/JS from ../frontend
 * So the whole app runs at http://localhost:3000 and there are no CORS issues.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banking_fraud_db';
if (process.env.TEST_MODE === undefined) process.env.TEST_MODE = 'true';

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 } // 1 hour
  })
);

// Simple request log
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) console.log(`${new Date().toLocaleTimeString()}  ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/test', require('./routes/testRoutes'));

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));

// Frontend (static files)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Generic error handler (e.g. invalid JSON body)
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = status < 500 ? 'Bad request.' : 'Internal server error.';
  res.status(status).json({ success: false, message });
});

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
    console.log(`[SERVER] TEST_MODE = ${process.env.TEST_MODE}`);
  });
});

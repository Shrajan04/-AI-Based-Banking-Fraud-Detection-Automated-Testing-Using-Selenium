/**
 * Demo / test data. Used by:
 *   - `npm run seed`            (backend/seed/seed.js)
 *   - POST /api/test/reset      (the reset.html page used by Selenium)
 *
 * All data is fake. The state after seeding is always the same, so the
 * Selenium tests can assert exact values (balances, counts, IDs).
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');

const USERS = [
  { name: 'System Admin', username: 'admin', password: 'Admin@123', email: 'admin@demobank.test', phone: '9000000000', accountNumber: '10000000', balance: 0, role: 'admin' },
  { name: 'Test User', username: 'testuser', password: 'Test@123', email: 'testuser@demobank.test', phone: '9000000001', accountNumber: '10000001', balance: 50000 },
  { name: 'Ravi Kumar', username: 'ravi', password: 'Ravi@123', email: 'ravi@demobank.test', phone: '9000000002', accountNumber: '10000002', balance: 25000 },
  { name: 'Priya Sharma', username: 'priya', password: 'Priya@123', email: 'priya@demobank.test', phone: '9000000003', accountNumber: '10000003', balance: 30000 },
  { name: 'Anil Mehta', username: 'richuser', password: 'Rich@123', email: 'anil@demobank.test', phone: '9000000004', accountNumber: '10000004', balance: 500000 },
  { name: 'Suresh Rao', username: 'riskyuser', password: 'Risky@123', email: 'suresh@demobank.test', phone: '9000000005', accountNumber: '10000005', balance: 80000 },
  { name: 'Locked User', username: 'lockeduser', password: 'Locked@123', email: 'locked@demobank.test', phone: '9000000006', accountNumber: '10000006', balance: 10000, isLocked: true, failedLoginAttempts: 3 }
];

/** Returns a Date `days` days ago at the given hour:minute (local time). */
function daysAgo(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const L = (score, level, status, reasons = []) => ({ riskScore: score, riskLevel: level, status, fraudReasons: reasons });

function buildTransactions() {
  return [
    // testuser has a normal history with Ravi (10000002). Average = 2,250
    { transactionId: 'TXN1001', senderAccount: '10000001', receiverAccount: '10000002', amount: 1500, description: 'Rent share', t: daysAgo(20, 10), ...L(10, 'LOW', 'APPROVED', ['First transaction to this receiver']) },
    { transactionId: 'TXN1002', senderAccount: '10000001', receiverAccount: '10000002', amount: 2000, description: 'Groceries', t: daysAgo(15, 11), ...L(0, 'LOW', 'APPROVED') },
    { transactionId: 'TXN1003', senderAccount: '10000001', receiverAccount: '10000002', amount: 2500, description: 'Electricity bill', t: daysAgo(10, 12), ...L(0, 'LOW', 'APPROVED') },
    { transactionId: 'TXN1004', senderAccount: '10000001', receiverAccount: '10000002', amount: 3000, description: 'Trip expenses', t: daysAgo(5, 15), ...L(0, 'LOW', 'APPROVED') },
    { transactionId: 'TXN1005', senderAccount: '10000002', receiverAccount: '10000001', amount: 1000, description: 'Refund', t: daysAgo(4, 16), ...L(10, 'LOW', 'APPROVED', ['First transaction to this receiver']) },
    // richuser: normal history. Average = 5,000
    { transactionId: 'TXN1006', senderAccount: '10000004', receiverAccount: '10000002', amount: 5000, description: 'Consulting fee', t: daysAgo(12, 10), ...L(10, 'LOW', 'APPROVED', ['First transaction to this receiver']) },
    { transactionId: 'TXN1007', senderAccount: '10000004', receiverAccount: '10000003', amount: 4000, description: 'Office supplies', t: daysAgo(9, 14), ...L(10, 'LOW', 'APPROVED', ['First transaction to this receiver']) },
    { transactionId: 'TXN1008', senderAccount: '10000004', receiverAccount: '10000002', amount: 6000, description: 'Consulting fee', t: daysAgo(6, 11), ...L(0, 'LOW', 'APPROVED') },
    // riskyuser: flagged history (for the admin dashboard)
    { transactionId: 'TXN1009', senderAccount: '10000005', receiverAccount: '10000003', amount: 60000, description: 'Urgent payment', t: daysAgo(3, 2, 15), ...L(60, 'HIGH', 'BLOCKED', ['Large transaction amount (above Rs. 50,000)', 'First transaction to this receiver', 'Unusual transaction time (between 12 AM and 5 AM)']) },
    { transactionId: 'TXN1010', senderAccount: '10000005', receiverAccount: '10000002', amount: 5000, description: 'Transfer', t: daysAgo(2, 14), ...L(30, 'MEDIUM', 'SUSPICIOUS', ['First transaction to this receiver', 'Previous suspicious activity on this account']) }
  ].map(({ t, ...rest }) => ({ ...rest, transactionTime: t, createdAt: t }));
}

async function seedDatabase() {
  await Promise.all([User.deleteMany({}), Transaction.deleteMany({}), FraudAlert.deleteMany({})]);

  const users = [];
  for (const u of USERS) {
    users.push({
      ...u,
      password: await bcrypt.hash(u.password, 8),
      role: u.role || 'user',
      isLocked: !!u.isLocked,
      isBlocked: false,
      failedLoginAttempts: u.failedLoginAttempts || 0,
      createdAt: daysAgo(30, 9)
    });
  }
  const createdUsers = await User.insertMany(users);
  const byAccount = {};
  createdUsers.forEach((u) => { byAccount[u.accountNumber] = u; });

  const txns = buildTransactions();
  await Transaction.insertMany(txns);

  const alerts = txns
    .filter((t) => t.riskLevel !== 'LOW')
    .map((t) => ({
      transactionId: t.transactionId,
      userId: byAccount[t.senderAccount]._id,
      riskScore: t.riskScore,
      riskLevel: t.riskLevel,
      reasons: t.fraudReasons,
      status: 'OPEN',
      createdAt: t.createdAt
    }));
  await FraudAlert.insertMany(alerts);

  return { users: createdUsers.length, transactions: txns.length, alerts: alerts.length };
}

module.exports = { seedDatabase, USERS };

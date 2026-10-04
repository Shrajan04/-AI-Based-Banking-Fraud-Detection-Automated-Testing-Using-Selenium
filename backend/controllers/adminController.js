const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');

/** Map of accountNumber -> username, used to show "User" columns. */
async function accountMap() {
  const users = await User.find().select('accountNumber username');
  const map = {};
  users.forEach((u) => { map[u.accountNumber] = u.username; });
  return map;
}

// GET /api/admin/stats
async function stats(req, res) {
  try {
    const [total, approved, suspicious, blocked, users, openAlerts] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'APPROVED' }),
      Transaction.countDocuments({ status: 'SUSPICIOUS' }),
      Transaction.countDocuments({ status: 'BLOCKED' }),
      User.countDocuments({ role: 'user' }),
      FraudAlert.countDocuments({ status: 'OPEN' })
    ]);
    res.json({
      success: true,
      stats: {
        totalTransactions: total,
        approvedTransactions: approved,
        suspiciousTransactions: suspicious,
        blockedTransactions: blocked,
        totalUsers: users,
        openAlerts
      }
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading statistics.' });
  }
}

// GET /api/admin/transactions
async function allTransactions(req, res) {
  try {
    const map = await accountMap();
    const txns = await Transaction.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      transactions: txns.map((t) => ({ ...t.toJSON(), senderUsername: map[t.senderAccount] || t.senderAccount }))
    });
  } catch (err) {
    console.error('admin transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading transactions.' });
  }
}

// GET /api/admin/alerts
async function alerts(req, res) {
  try {
    const list = await FraudAlert.find().sort({ createdAt: -1 }).populate('userId', 'username name');
    res.json({
      success: true,
      alerts: list.map((a) => {
        const obj = a.toJSON();
        obj.username = a.userId ? a.userId.username : 'unknown';
        obj.userId = a.userId ? a.userId._id : null;
        return obj;
      })
    });
  } catch (err) {
    console.error('admin alerts error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading alerts.' });
  }
}

// GET /api/admin/users
async function users(req, res) {
  try {
    const list = await User.find({ role: 'user' }).sort({ accountNumber: 1 });
    res.json({ success: true, users: list.map((u) => u.toJSON()) });
  } catch (err) {
    console.error('admin users error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading users.' });
  }
}

// POST /api/admin/users/:username/block
async function blockUser(req, res) {
  const user = await User.findOne({ username: req.params.username, role: 'user' });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.isBlocked = true;
  await user.save();
  res.json({ success: true, message: `User ${user.username} has been blocked.` });
}

// POST /api/admin/users/:username/unblock  (also clears a login lock)
async function unblockUser(req, res) {
  const user = await User.findOne({ username: req.params.username, role: 'user' });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.isBlocked = false;
  user.isLocked = false;
  user.failedLoginAttempts = 0;
  await user.save();
  res.json({ success: true, message: `User ${user.username} has been unblocked.` });
}

// POST /api/admin/alerts/:transactionId/review
async function reviewAlert(req, res) {
  const alert = await FraudAlert.findOne({ transactionId: req.params.transactionId });
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
  alert.status = 'REVIEWED';
  await alert.save();
  res.json({ success: true, message: `Alert for ${alert.transactionId} marked as reviewed.` });
}

module.exports = { stats, allTransactions, alerts, users, blockUser, unblockUser, reviewAlert };

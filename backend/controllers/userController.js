const User = require('../models/User');
const Transaction = require('../models/Transaction');

// GET /api/user/dashboard
async function dashboard(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Please login first.' });

    const filter = { $or: [{ senderAccount: user.accountNumber }, { receiverAccount: user.accountNumber }] };
    const [totalTransactions, suspiciousTransactions, recent] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.countDocuments({ senderAccount: user.accountNumber, status: { $in: ['SUSPICIOUS', 'BLOCKED'] } }),
      Transaction.find(filter).sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      user: user.toJSON(),
      stats: { totalTransactions, suspiciousTransactions },
      recentTransactions: recent.map((t) => t.toJSON())
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading dashboard.' });
  }
}

// GET /api/user/profile
async function profile(req, res) {
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ success: false, message: 'Please login first.' });
  res.json({ success: true, user: user.toJSON() });
}

module.exports = { dashboard, profile };

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const { calculateRisk } = require('../services/fraudEngine');
const { MESSAGES, validateTransferInput } = require('../services/validators');

const RESULT_MESSAGES = {
  APPROVED: 'Transaction successful.',
  SUSPICIOUS: 'Suspicious activity detected. Transaction approved with warning.',
  BLOCKED: 'Fraud alert! Transaction blocked due to high risk.'
};

async function nextTransactionId() {
  const count = await Transaction.countDocuments();
  let n = 1001 + count;
  // Safety loop in case an ID already exists
  while (await Transaction.exists({ transactionId: `TXN${n}` })) n += 1;
  return `TXN${n}`;
}

/** Builds the Date the fraud engine should use (real time or simulated test time). */
function resolveTransactionTime(body) {
  const now = new Date();
  if (body.timeMode === 'custom' && process.env.TEST_MODE === 'true') {
    const [h, m] = String(body.customTime).split(':').map(Number);
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    return t;
  }
  return now;
}

/** Collects everything the fraud engine needs to know about the sender's history. */
async function buildHistory(senderAccount, receiverAccount) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [recentTransactionCount, toReceiver, pastTxns, suspicious] = await Promise.all([
    Transaction.countDocuments({ senderAccount, createdAt: { $gte: fiveMinutesAgo } }),
    Transaction.countDocuments({ senderAccount, receiverAccount }),
    Transaction.find({ senderAccount, status: { $ne: 'BLOCKED' } }).select('amount'),
    Transaction.countDocuments({ senderAccount, status: { $in: ['SUSPICIOUS', 'BLOCKED'] } })
  ]);
  return {
    recentTransactionCount,
    hasSentToReceiverBefore: toReceiver > 0,
    pastAmounts: pastTxns.map((t) => t.amount),
    hasPreviousSuspicious: suspicious > 0
  };
}

// POST /api/transactions/transfer
async function transfer(req, res) {
  try {
    const sender = await User.findById(req.session.userId);
    if (!sender) return res.status(401).json({ success: false, message: 'Please login first.' });
    if (sender.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
    }

    const error = validateTransferInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const receiverAccount = String(req.body.receiverAccount).trim();
    const amount = Number(req.body.amount);

    if (receiverAccount === sender.accountNumber) {
      return res.status(400).json({ success: false, message: MESSAGES.RECEIVER_SELF });
    }
    const receiver = await User.findOne({ accountNumber: receiverAccount, role: 'user' });
    if (!receiver) return res.status(404).json({ success: false, message: MESSAGES.RECEIVER_NOT_FOUND });
    if (amount > sender.balance) {
      return res.status(400).json({ success: false, message: MESSAGES.INSUFFICIENT_BALANCE });
    }

    // ---- Fraud detection ----
    const transactionTime = resolveTransactionTime(req.body);
    const history = await buildHistory(sender.accountNumber, receiverAccount);
    const risk = calculateRisk({ amount, transactionTime }, history);

    const txn = await Transaction.create({
      transactionId: await nextTransactionId(),
      senderAccount: sender.accountNumber,
      receiverAccount,
      amount,
      description: String(req.body.description || '').trim().slice(0, 100),
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      status: risk.status,
      fraudReasons: risk.reasons,
      transactionTime
    });

    // Money only moves when the transaction is not blocked
    if (risk.status !== 'BLOCKED') {
      sender.balance = Math.round((sender.balance - amount) * 100) / 100;
      receiver.balance = Math.round((receiver.balance + amount) * 100) / 100;
      await sender.save();
      await receiver.save();
    }

    // Medium and high risk transactions create an alert for the admin
    if (risk.riskLevel !== 'LOW') {
      await FraudAlert.create({
        transactionId: txn.transactionId,
        userId: sender._id,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        reasons: risk.reasons
      });
    }

    res.status(201).json({
      success: true,
      message: RESULT_MESSAGES[risk.status],
      transaction: txn.toJSON(),
      receiverName: receiver.name,
      newBalance: sender.balance
    });
  } catch (err) {
    console.error('transfer error:', err);
    res.status(500).json({ success: false, message: 'Server error during transfer.' });
  }
}

// GET /api/transactions  (current user's transactions)
async function myTransactions(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Please login first.' });
    const txns = await Transaction.find({
      $or: [{ senderAccount: user.accountNumber }, { receiverAccount: user.accountNumber }]
    }).sort({ createdAt: -1 });
    res.json({ success: true, accountNumber: user.accountNumber, transactions: txns.map((t) => t.toJSON()) });
  } catch (err) {
    console.error('transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error while loading transactions.' });
  }
}

module.exports = { transfer, myTransactions, RESULT_MESSAGES };

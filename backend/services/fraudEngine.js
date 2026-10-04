/**
 * Explainable Fraud Risk Engine
 * ------------------------------
 * A rule-based ("expert system") risk scorer. Every rule that fires adds
 * points to the score AND a human-readable reason, so the result can always
 * be explained. There is NO randomness: the same input always gives the same
 * output, which is what makes the Selenium tests deterministic.
 *
 * The same rules are implemented in Python in fraud-detection/fraud_engine.py.
 */

const RULES = {
  VERY_LARGE_AMOUNT: { limit: 100000, points: 40 },
  LARGE_AMOUNT: { limit: 50000, points: 20 },
  HIGH_FREQUENCY: { windowMinutes: 5, maxPrevious: 3, points: 30 },
  NEW_RECEIVER: { points: 10 },
  UNUSUAL_TIME: { startHour: 0, endHour: 5, points: 30 }, // 12:00 AM to 4:59 AM
  AMOUNT_DEVIATION: { multiplier: 3, minHistory: 3, points: 20 },
  PREVIOUS_SUSPICIOUS: { points: 20 }
};

const REASONS = {
  VERY_LARGE_AMOUNT: 'Very large transaction amount (above Rs. 1,00,000)',
  LARGE_AMOUNT: 'Large transaction amount (above Rs. 50,000)',
  HIGH_FREQUENCY: 'Multiple transactions within a short period (3 or more in last 5 minutes)',
  NEW_RECEIVER: 'First transaction to this receiver',
  UNUSUAL_TIME: 'Unusual transaction time (between 12 AM and 5 AM)',
  AMOUNT_DEVIATION: 'Amount is much higher than the usual spending pattern',
  PREVIOUS_SUSPICIOUS: 'Previous suspicious activity on this account'
};

function getRiskLevel(score) {
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

function getStatus(level) {
  if (level === 'HIGH') return 'BLOCKED';
  if (level === 'MEDIUM') return 'SUSPICIOUS';
  return 'APPROVED';
}

/**
 * @param {object} txn      { amount: Number, transactionTime: Date }
 * @param {object} history  {
 *   recentTransactionCount: Number  - sender's transactions in the last 5 minutes
 *   hasSentToReceiverBefore: Boolean
 *   pastAmounts: Number[]           - sender's earlier (not blocked) amounts
 *   hasPreviousSuspicious: Boolean  - any earlier SUSPICIOUS/BLOCKED transaction
 * }
 * @returns {{riskScore:Number, riskLevel:String, status:String, reasons:String[]}}
 */
function calculateRisk(txn, history) {
  let score = 0;
  const reasons = [];
  const amount = Number(txn.amount);

  // Rule 1: amount anomaly (only the higher tier applies)
  if (amount > RULES.VERY_LARGE_AMOUNT.limit) {
    score += RULES.VERY_LARGE_AMOUNT.points;
    reasons.push(REASONS.VERY_LARGE_AMOUNT);
  } else if (amount > RULES.LARGE_AMOUNT.limit) {
    score += RULES.LARGE_AMOUNT.points;
    reasons.push(REASONS.LARGE_AMOUNT);
  }

  // Rule 2: transaction frequency
  if (history.recentTransactionCount >= RULES.HIGH_FREQUENCY.maxPrevious) {
    score += RULES.HIGH_FREQUENCY.points;
    reasons.push(REASONS.HIGH_FREQUENCY);
  }

  // Rule 3: new receiver
  if (!history.hasSentToReceiverBefore) {
    score += RULES.NEW_RECEIVER.points;
    reasons.push(REASONS.NEW_RECEIVER);
  }

  // Rule 4: unusual time (uses the transaction time, which may be simulated)
  const hour = new Date(txn.transactionTime).getHours();
  if (hour >= RULES.UNUSUAL_TIME.startHour && hour < RULES.UNUSUAL_TIME.endHour) {
    score += RULES.UNUSUAL_TIME.points;
    reasons.push(REASONS.UNUSUAL_TIME);
  }

  // Rule 5: deviation from the user's normal amount
  const past = history.pastAmounts || [];
  if (past.length >= RULES.AMOUNT_DEVIATION.minHistory) {
    const average = past.reduce((sum, a) => sum + a, 0) / past.length;
    if (amount > average * RULES.AMOUNT_DEVIATION.multiplier) {
      score += RULES.AMOUNT_DEVIATION.points;
      reasons.push(REASONS.AMOUNT_DEVIATION);
    }
  }

  // Rule 6: previous suspicious activity
  if (history.hasPreviousSuspicious) {
    score += RULES.PREVIOUS_SUSPICIOUS.points;
    reasons.push(REASONS.PREVIOUS_SUSPICIOUS);
  }

  score = Math.min(score, 100);
  const riskLevel = getRiskLevel(score);
  return { riskScore: score, riskLevel, status: getStatus(riskLevel), reasons };
}

module.exports = { calculateRisk, getRiskLevel, getStatus, RULES, REASONS };

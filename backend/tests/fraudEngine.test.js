/**
 * Unit tests for the fraud engine (no database needed).
 * Run from the backend folder:  npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const { calculateRisk, getRiskLevel } = require('../services/fraudEngine');

const at = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };
const normalHistory = {
  recentTransactionCount: 0,
  hasSentToReceiverBefore: true,
  pastAmounts: [1500, 2000, 2500, 3000],
  hasPreviousSuspicious: false
};

test('Scenario A: normal transaction is LOW and APPROVED', () => {
  const r = calculateRisk({ amount: 1000, transactionTime: at(10) }, normalHistory);
  assert.strictEqual(r.riskScore, 0);
  assert.strictEqual(r.riskLevel, 'LOW');
  assert.strictEqual(r.status, 'APPROVED');
  assert.deepStrictEqual(r.reasons, []);
});

test('Scenario B: very large amount + deviation is HIGH and BLOCKED', () => {
  const r = calculateRisk({ amount: 150000, transactionTime: at(10) }, { ...normalHistory, pastAmounts: [5000, 4000, 6000] });
  assert.strictEqual(r.riskScore, 60);
  assert.strictEqual(r.riskLevel, 'HIGH');
  assert.strictEqual(r.status, 'BLOCKED');
});

test('Scenario C: 4th transaction within 5 minutes is SUSPICIOUS', () => {
  const r = calculateRisk({ amount: 500, transactionTime: at(10) }, { ...normalHistory, recentTransactionCount: 3 });
  assert.strictEqual(r.riskScore, 30);
  assert.strictEqual(r.status, 'SUSPICIOUS');
});

test('Scenario D: transaction at 02:30 is SUSPICIOUS', () => {
  const r = calculateRisk({ amount: 1000, transactionTime: at(2, 30) }, normalHistory);
  assert.strictEqual(r.riskScore, 30);
  assert.strictEqual(r.riskLevel, 'MEDIUM');
  assert.ok(r.reasons[0].startsWith('Unusual transaction time'));
});

test('Scenario E: night + new receiver + deviation is HIGH (60)', () => {
  const r = calculateRisk({ amount: 10000, transactionTime: at(2, 30) }, { ...normalHistory, hasSentToReceiverBefore: false });
  assert.strictEqual(r.riskScore, 60);
  assert.strictEqual(r.status, 'BLOCKED');
  assert.strictEqual(r.reasons.length, 3);
});

test('New receiver alone stays LOW (10)', () => {
  const r = calculateRisk({ amount: 1000, transactionTime: at(10) }, { ...normalHistory, hasSentToReceiverBefore: false });
  assert.strictEqual(r.riskScore, 10);
  assert.strictEqual(r.status, 'APPROVED');
});

test('Hour 05:00 is NOT unusual (boundary)', () => {
  const r = calculateRisk({ amount: 1000, transactionTime: at(5, 0) }, normalHistory);
  assert.strictEqual(r.riskScore, 0);
});

test('Score is capped at 100', () => {
  const r = calculateRisk({ amount: 200000, transactionTime: at(1) }, {
    recentTransactionCount: 5, hasSentToReceiverBefore: false, pastAmounts: [100, 100, 100], hasPreviousSuspicious: true
  });
  assert.strictEqual(r.riskScore, 100);
});

test('Risk level boundaries', () => {
  assert.strictEqual(getRiskLevel(29), 'LOW');
  assert.strictEqual(getRiskLevel(30), 'MEDIUM');
  assert.strictEqual(getRiskLevel(59), 'MEDIUM');
  assert.strictEqual(getRiskLevel(60), 'HIGH');
});

test('Same input always gives the same output (deterministic)', () => {
  const a = calculateRisk({ amount: 75000, transactionTime: at(3) }, normalHistory);
  const b = calculateRisk({ amount: 75000, transactionTime: at(3) }, normalHistory);
  assert.deepStrictEqual(a, b);
});

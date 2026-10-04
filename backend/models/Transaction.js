const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    senderAccount: { type: String, required: true },
    receiverAccount: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, default: '', trim: true, maxlength: 100 },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    status: { type: String, enum: ['APPROVED', 'SUSPICIOUS', 'BLOCKED'], required: true },
    fraudReasons: { type: [String], default: [] },
    // Time used by the fraud engine (can be a simulated "custom test time")
    transactionTime: { type: Date, required: true }
  },
  // createdAt = real time the record was saved (used for the frequency rule)
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);

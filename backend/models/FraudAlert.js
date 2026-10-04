const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['MEDIUM', 'HIGH'], required: true },
    reasons: { type: [String], default: [] },
    status: { type: String, enum: ['OPEN', 'REVIEWED'], default: 'OPEN' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

fraudAlertSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);

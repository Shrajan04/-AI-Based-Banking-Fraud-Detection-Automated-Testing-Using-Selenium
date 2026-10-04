const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never the plain password
    accountNumber: { type: String, required: true, unique: true, match: /^\d{8}$/ },
    balance: { type: Number, required: true, min: 0, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false }, // locked after 3 wrong passwords
    isBlocked: { type: Boolean, default: false }, // blocked manually by the admin
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Remove the password hash whenever a user is converted to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

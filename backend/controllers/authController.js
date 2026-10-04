const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { MESSAGES, validateRegistration, isBlank } = require('../services/validators');

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MESSAGE = 'Account temporarily locked due to multiple failed login attempts.';
const BLOCKED_MESSAGE = 'Your account has been blocked by the administrator.';
const INVALID_MESSAGE = 'Invalid username or password.';

async function generateAccountNumber() {
  const last = await User.findOne().sort({ accountNumber: -1 }).select('accountNumber');
  const next = last ? Number(last.accountNumber) + 1 : 10000001;
  return String(next);
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const error = validateRegistration(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const username = req.body.username.trim().toLowerCase();
    if (await User.findOne({ username })) {
      return res.status(409).json({ success: false, message: MESSAGES.USERNAME_TAKEN });
    }

    const user = await User.create({
      name: req.body.name.trim(),
      username,
      email: req.body.email.trim(),
      phone: req.body.phone.trim(),
      password: await bcrypt.hash(req.body.password, 10),
      accountNumber: await generateAccountNumber(),
      balance: Number(req.body.initialBalance),
      role: 'user'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      accountNumber: user.accountNumber
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

/** Shared login logic for users and admins. */
async function doLogin(req, res, expectedRole) {
  try {
    const { username, password } = req.body;
    if (isBlank(username)) return res.status(400).json({ success: false, message: MESSAGES.USERNAME_REQUIRED });
    if (isBlank(password)) return res.status(400).json({ success: false, message: MESSAGES.PASSWORD_REQUIRED });

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: INVALID_MESSAGE });

    if (user.role !== expectedRole) {
      const msg = expectedRole === 'admin'
        ? 'This account is not an admin account.'
        : 'Admins must use the Admin Login page.';
      return res.status(403).json({ success: false, message: msg });
    }

    if (user.isBlocked) return res.status(403).json({ success: false, message: BLOCKED_MESSAGE });
    if (user.isLocked) return res.status(423).json({ success: false, message: LOCK_MESSAGE });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS && user.role !== 'admin') {
        user.isLocked = true;
        await user.save();
        return res.status(423).json({ success: false, message: LOCK_MESSAGE });
      }
      await user.save();
      const left = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      const msg = user.role === 'admin' ? INVALID_MESSAGE : `${INVALID_MESSAGE} ${left} attempt(s) left.`;
      return res.status(401).json({ success: false, message: msg });
    }

    user.failedLoginAttempts = 0;
    await user.save();

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    res.json({ success: true, message: 'Login successful.', user: user.toJSON() });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

// POST /api/auth/login
const login = (req, res) => doLogin(req, res, 'user');

// POST /api/auth/admin-login
const adminLogin = (req, res) => doLogin(req, res, 'admin');

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'You have been logged out.' });
  });
}

// GET /api/auth/me
async function me(req, res) {
  if (!req.session.userId) return res.status(401).json({ success: false, message: 'Not logged in.' });
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ success: false, message: 'Not logged in.' });
  res.json({ success: true, user: user.toJSON() });
}

module.exports = { register, login, adminLogin, logout, me, LOCK_MESSAGE };

/** Route guards based on the session created at login. */

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please login first.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only.' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };

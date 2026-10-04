const express = require('express');
const auth = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', asyncHandler(auth.login));
router.post('/admin-login', asyncHandler(auth.adminLogin));
router.post('/logout', auth.logout);
router.get('/me', asyncHandler(auth.me));

module.exports = router;

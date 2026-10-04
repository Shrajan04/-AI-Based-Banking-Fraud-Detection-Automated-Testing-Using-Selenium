const express = require('express');
const { requireLogin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const user = require('../controllers/userController');

const router = express.Router();

router.get('/dashboard', requireLogin, asyncHandler(user.dashboard));
router.get('/profile', requireLogin, asyncHandler(user.profile));

module.exports = router;

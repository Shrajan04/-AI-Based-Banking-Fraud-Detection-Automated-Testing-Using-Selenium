const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const admin = require('../controllers/adminController');

const router = express.Router();

router.use(requireAdmin); // every admin route needs an admin session

router.get('/stats', asyncHandler(admin.stats));
router.get('/transactions', asyncHandler(admin.allTransactions));
router.get('/alerts', asyncHandler(admin.alerts));
router.get('/users', asyncHandler(admin.users));
router.post('/users/:username/block', asyncHandler(admin.blockUser));
router.post('/users/:username/unblock', asyncHandler(admin.unblockUser));
router.post('/alerts/:transactionId/review', asyncHandler(admin.reviewAlert));

module.exports = router;

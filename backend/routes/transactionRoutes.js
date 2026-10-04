const express = require('express');
const { requireLogin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const txn = require('../controllers/transactionController');

const router = express.Router();

router.post('/transfer', requireLogin, asyncHandler(txn.transfer));
router.get('/', requireLogin, asyncHandler(txn.myTransactions));

module.exports = router;

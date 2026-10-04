/**
 * Test-support routes. Only available when TEST_MODE=true.
 * They let Selenium put the database back into a known state before a test,
 * which makes every test repeatable (deterministic).
 */
const express = require('express');
const { seedDatabase } = require('../seed/seedData');

const router = express.Router();

router.use((req, res, next) => {
  if (process.env.TEST_MODE !== 'true') {
    return res.status(403).json({ success: false, message: 'Test mode is disabled.' });
  }
  next();
});

// GET /api/test/status -> tells the frontend whether test features are on
router.get('/status', (req, res) => res.json({ success: true, testMode: true }));

// POST /api/test/reset -> wipe and reload the demo data, and log out
router.post('/reset', async (req, res) => {
  try {
    const summary = await seedDatabase();
    req.session.destroy(() => {
      res.json({ success: true, message: 'Demo data has been reset.', summary });
    });
  } catch (err) {
    console.error('reset error:', err);
    res.status(500).json({ success: false, message: 'Reset failed: ' + err.message });
  }
});

module.exports = router;

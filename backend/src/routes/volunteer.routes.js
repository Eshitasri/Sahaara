const express = require('express');
const router = express.Router();

// Example routes (basic)
router.get('/', (req, res) => {
  res.json({ message: 'Volunteer routes working' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Volunteer registered' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const fraudService = require('../services/fraud.service');
const Delivery = require('../models/Delivery.model');
const User = require('../models/User.model');

router.use(protect, restrictTo('admin'));

// Get all fraud alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = await fraudService.getFraudAlerts();
    res.json({ success: true, count: alerts.length, alerts });
  } catch (err) { next(err); }
});

// Run full fraud scan
router.post('/scan', async (req, res, next) => {
  try {
    const result = await fraudService.runGlobalFraudScan();
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

// Analyze a specific delivery
router.get('/analyze/:deliveryId', async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId)
      .populate('donation', 'pickupLocation')
      .populate('request', 'deliveryLocation')
      .populate('volunteer', 'name trustScore');

    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });

    const result = await fraudService.analyzeDelivery(delivery);
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

// Suspend a flagged user
router.patch('/suspend/:userId', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { status: 'suspended', isAvailable: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `${user.name} has been suspended.`, user });
  } catch (err) { next(err); }
});

// Clear fraud flag
router.patch('/clear/:deliveryId', async (req, res, next) => {
  try {
    await Delivery.findByIdAndUpdate(req.params.deliveryId, { isFlagged: false, fraudScore: 0, fraudFlags: [] });
    res.json({ success: true, message: 'Fraud flag cleared.' });
  } catch (err) { next(err); }
});

module.exports = router;

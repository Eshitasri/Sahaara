const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const Request = require('../models/Request.model');

router.use(protect);

// Create NGO request
router.post('/', restrictTo('ngo'), async (req, res, next) => {
  try {
    const { category, title, description, quantityNeeded, beneficiariesCount,
            urgency, deliveryAddress, latitude, longitude, neededBy } = req.body;

    const request = await Request.create({
      ngo: req.user.id,
      category, title, description, quantityNeeded,
      beneficiariesCount, urgency, neededBy, deliveryAddress,
      deliveryLocation: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      priorityScore: { low: 3, medium: 5, high: 8, critical: 10 }[urgency] || 5,
    });

    res.status(201).json({ success: true, request });
  } catch (err) { next(err); }
});

// Get requests
router.get('/', async (req, res, next) => {
  try {
    const { status, category, urgency, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'ngo') filter.ngo = req.user.id;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    const requests = await Request.find(filter)
      .populate('ngo', 'name ngoName city')
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Request.countDocuments(filter);
    res.json({ success: true, total, requests });
  } catch (err) { next(err); }
});

// Get single request
router.get('/:id', async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('ngo', 'name ngoName city phone');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    res.json({ success: true, request });
  } catch (err) { next(err); }
});

// Update request
router.patch('/:id', restrictTo('ngo', 'admin'), async (req, res, next) => {
  try {
    const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, request });
  } catch (err) { next(err); }
});

// Cancel request
router.delete('/:id/cancel', restrictTo('ngo', 'admin'), async (req, res, next) => {
  try {
    await Request.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true, message: 'Request cancelled.' });
  } catch (err) { next(err); }
});

module.exports = router;

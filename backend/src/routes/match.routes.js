// ─── match.routes.js ──────────────────────────────────────────────────────────
const express = require('express');
const matchRouter = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const matchingService = require('../services/matching.service');

matchRouter.use(protect);

// Run AI match for a donation
matchRouter.get('/donation/:donationId', restrictTo('admin', 'donor'), async (req, res, next) => {
  try {
    const result = await matchingService.matchDonationToRequest(req.params.donationId);
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

// Find best volunteer for a route
matchRouter.post('/volunteer', restrictTo('admin'), async (req, res, next) => {
  try {
    const { donorCoords, ngoCoords } = req.body;
    const result = await matchingService.findBestVolunteer(donorCoords, ngoCoords);
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

// Demand analysis
matchRouter.get('/demand-analysis', restrictTo('admin'), async (req, res, next) => {
  try {
    const analysis = await matchingService.analyzeDemand();
    res.json({ success: true, analysis });
  } catch (err) { next(err); }
});

module.exports = matchRouter;

/**
 * Claude AI Routes
 * Sabhi AI-powered endpoints yahan hain
 */

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const claudeService = require('../services/claude.service');
const matchingService = require('../services/matching.service');
const Donation = require('../models/Donation.model');
const Request = require('../models/Request.model');
const Delivery = require('../models/Delivery.model');
const logger = require('../utils/logger');

// ─── 1. SMART AI MATCH ────────────────────────────────────────────────────────
// Admin ya donor Claude se smart match karaaye
router.get('/smart-match/:donationId', protect, restrictTo('admin', 'donor'), async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.donationId).populate('donor', 'name city');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation nahi mili.' });
    if (donation.status !== 'available') return res.status(400).json({ success: false, message: 'Donation available nahi hai.' });

    // Pehle mathematical candidates dhundo
    const openRequests = await Request.find({ status: 'open' }).populate('ngo', 'name ngoName city');
    if (openRequests.length === 0) {
      return res.json({ success: false, message: 'Abhi koi NGO request open nahi hai.' });
    }

    // Mathematical scoring karo (candidates ke liye)
    const { haversineDistance } = matchingService;
    const candidates = openRequests
      .map(request => {
        const distKm = haversineDistance(
          donation.pickupLocation.coordinates,
          request.deliveryLocation.coordinates
        ).toFixed(2);
        const catMatch = donation.category === request.category ? 1 :
          (['food_cooked', 'food_raw'].includes(donation.category) && ['food_cooked', 'food_raw'].includes(request.category)) ? 0.6 : 0;
        if (catMatch === 0) return null;
        const urgencyScore = { low: 0.6, medium: 0.8, high: 1.0, critical: 1.3 }[request.urgency] || 0.8;
        const distScore = Math.max(0, 1 - distKm / 50);
        const score = (distScore * 0.4 + catMatch * 0.3 + urgencyScore * 0.3).toFixed(4);
        return { request, distKm, score: parseFloat(score) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 candidates Claude ko bhejo

    if (candidates.length === 0) {
      return res.json({ success: false, message: 'Koi compatible request nahi mili.' });
    }

    // Claude se smart decision lo
    const claudeResult = await claudeService.smartMatch(donation, candidates);

    res.json({
      success: true,
      donation: { id: donation._id, title: donation.title, category: donation.category },
      claudeDecision: claudeResult,
      allCandidates: candidates,
      message: claudeResult.fallback ? 'Mathematical matching used (Claude unavailable)' : 'Claude AI ne match kiya!',
    });
  } catch (err) { next(err); }
});

// ─── 2. DONATION SUGGESTIONS ──────────────────────────────────────────────────
// Donor ko Claude batayega kya donate karein
router.get('/donation-suggestions', protect, restrictTo('donor'), async (req, res, next) => {
  try {
    const { analyzeDemand } = matchingService;
    const demandData = await analyzeDemand();
    const city = req.user.city || 'your city';

    const suggestions = await claudeService.getDonationSuggestions(demandData.analysis, city);

    res.json({
      success: true,
      city,
      currentDemand: demandData.analysis,
      suggestions,
    });
  } catch (err) { next(err); }
});

// ─── 3. FRAUD EXPLANATION ────────────────────────────────────────────────────
// Admin ko Claude samjhayega fraud kyu hua
router.get('/explain-fraud/:deliveryId', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId)
      .populate('volunteer', 'name phone trustScore')
      .populate('donor', 'name')
      .populate('ngo', 'name ngoName');

    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery nahi mili.' });
    if (!delivery.isFlagged) return res.json({ success: false, message: 'Yeh delivery flagged nahi hai.' });

    const explanation = await claudeService.explainFraud(delivery, delivery.fraudFlags, delivery.fraudScore);

    res.json({
      success: true,
      deliveryId: delivery._id,
      fraudScore: delivery.fraudScore,
      flags: delivery.fraudFlags,
      claudeExplanation: explanation,
    });
  } catch (err) { next(err); }
});

// ─── 4. DEMAND PREDICTION ────────────────────────────────────────────────────
// Admin ke liye next week prediction
router.get('/predict-demand', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { analyzeDemand } = matchingService;
    const currentData = await analyzeDemand();

    // Simple historical data simulate karo (real app mein database se aayega)
    const historicalData = {
      lastWeek: currentData.analysis.map(d => ({ ...d, demandCount: Math.max(0, d.demandCount - 2) })),
      twoWeeksAgo: currentData.analysis.map(d => ({ ...d, demandCount: Math.max(0, d.demandCount - 4) })),
    };

    const city = req.query.city || 'Lucknow';
    const prediction = await claudeService.predictDemand(historicalData, currentData.analysis, city);

    res.json({
      success: true,
      city,
      currentAnalysis: currentData.analysis,
      prediction,
    });
  } catch (err) { next(err); }
});

// ─── 5. WELFARE CHATBOT ───────────────────────────────────────────────────────
// Sabhi users ke liye AI chatbot
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message empty hai.' });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message bahut lamba hai (max 500 characters).' });
    }

    const result = await claudeService.welfareChatbot(message, req.user.role, conversationHistory);

    res.json({
      success: true,
      reply: result.reply,
      poweredBy: result.poweredBy || 'AI',
    });
  } catch (err) { next(err); }
});

// ─── 6. ANALYZE NGO REQUEST ───────────────────────────────────────────────────
// Jab NGO request submit kare, Claude analyze kare
router.post('/analyze-request', protect, restrictTo('ngo', 'admin'), async (req, res, next) => {
  try {
    const { category, title, quantityNeeded, beneficiariesCount, urgency, description } = req.body;
    const analysis = await claudeService.analyzeNGORequest({ category, title, quantityNeeded, beneficiariesCount, urgency, description });
    res.json({ success: true, analysis });
  } catch (err) { next(err); }
});

// ─── 7. AI STATUS CHECK ───────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    success: true,
    claudeAI: {
      connected: hasKey,
      model: 'claude-opus-4-6',
      features: [
        { name: 'Smart Matching', status: hasKey ? 'active' : 'needs API key' },
        { name: 'Donation Suggestions', status: hasKey ? 'active' : 'needs API key' },
        { name: 'Fraud Explanation', status: hasKey ? 'active' : 'needs API key' },
        { name: 'Demand Prediction', status: hasKey ? 'active' : 'needs API key' },
        { name: 'Welfare Chatbot', status: hasKey ? 'active' : 'needs API key' },
      ],
    },
  });
});

module.exports = router;

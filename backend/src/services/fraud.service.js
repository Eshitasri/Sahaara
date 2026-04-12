/**
 * AI Fraud Detection Service
 * Analyzes delivery behavior to detect suspicious activity.
 * Scores 0-100: 0 = clean, 100 = definitely fraud.
 */

const Delivery = require('../models/Delivery.model');
const { haversineDistance } = require('./matching.service');
const logger = require('../utils/logger');

// ─── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLDS = {
  MAX_LATE_MINUTES: 45,         // delivery more than 45 min late = suspicious
  MAX_GPS_DRIFT_KM: 5,          // volunteer moved > 5km off route = suspicious
  OTP_MISMATCH_STRIKES: 2,      // 2+ OTP failures = flag
  PHOTO_MISSING_SCORE: 30,      // no photo submitted adds 30 to fraud score
  REPEAT_OFFENSE_MULTIPLIER: 1.5,
};

// ─── Analyze a Single Delivery ────────────────────────────────────────────────
async function analyzeDelivery(delivery) {
  const flags = [];
  let fraudScore = 0;

  // 1. Time check — was delivery significantly late?
  if (delivery.expectedDeliveryTime && delivery.deliveredAt) {
    const lateMs = delivery.deliveredAt - delivery.expectedDeliveryTime;
    const lateMins = lateMs / 60000;
    if (lateMins > THRESHOLDS.MAX_LATE_MINUTES) {
      const severity = Math.min(40, lateMins / 2);
      fraudScore += severity;
      flags.push({
        type: 'late_delivery',
        description: `Delivery was ${Math.round(lateMins)} minutes late (threshold: ${THRESHOLDS.MAX_LATE_MINUTES} min)`,
      });
    }
  }

  // 2. GPS drift check — did volunteer go off route?
  if (delivery.volunteerRoutePoints && delivery.volunteerRoutePoints.length > 2) {
    const donorCoords = delivery.donation?.pickupLocation?.coordinates;
    const ngoCoords = delivery.request?.deliveryLocation?.coordinates;

    if (donorCoords && ngoCoords) {
      const directDist = haversineDistance(donorCoords, ngoCoords);
      const routeDist = calculateRouteDistance(delivery.volunteerRoutePoints);
      const driftRatio = routeDist / (directDist || 1);

      if (driftRatio > 2.5) {
        fraudScore += 25;
        flags.push({
          type: 'gps_drift',
          description: `Route distance (${routeDist.toFixed(1)}km) is ${driftRatio.toFixed(1)}x the direct distance (${directDist.toFixed(1)}km)`,
        });
      }
    }
  }

  // 3. Photo proof missing
  if (!delivery.pickupPhotoUrl) {
    fraudScore += THRESHOLDS.PHOTO_MISSING_SCORE;
    flags.push({ type: 'missing_pickup_photo', description: 'No pickup photo submitted' });
  }
  if (delivery.status === 'delivered' && !delivery.deliveryPhotoUrl) {
    fraudScore += THRESHOLDS.PHOTO_MISSING_SCORE;
    flags.push({ type: 'missing_delivery_photo', description: 'No delivery photo submitted' });
  }

  // 4. OTP never confirmed but status shows delivered
  if (delivery.status === 'delivered' && delivery.pickupOtp && !delivery.pickedUpAt) {
    fraudScore += 35;
    flags.push({ type: 'otp_bypass', description: 'Delivery marked complete without OTP confirmation' });
  }

  // 5. Check volunteer's repeat offense history
  if (delivery.volunteer) {
    const previousFlags = await Delivery.countDocuments({
      volunteer: delivery.volunteer,
      isFlagged: true,
      _id: { $ne: delivery._id },
    });
    if (previousFlags > 0) {
      fraudScore = Math.round(fraudScore * Math.pow(THRESHOLDS.REPEAT_OFFENSE_MULTIPLIER, previousFlags));
      flags.push({
        type: 'repeat_offense',
        description: `Volunteer has ${previousFlags} previous flagged delivery(ies)`,
      });
    }
  }

  fraudScore = Math.min(100, Math.round(fraudScore));
  const isFlagged = fraudScore >= 40;

  logger.info(`Fraud analysis for delivery ${delivery._id}: score=${fraudScore}, flagged=${isFlagged}`);

  return { fraudScore, isFlagged, flags };
}

// ─── Run Fraud Scan on All Unreviewed Deliveries ──────────────────────────────
async function runGlobalFraudScan() {
  const deliveries = await Delivery.find({
    status: 'delivered',
    isFlagged: false,
    fraudScore: { $lt: 40 },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
  })
    .populate('donation', 'pickupLocation')
    .populate('request', 'deliveryLocation')
    .populate('volunteer', 'name trustScore');

  const results = [];

  for (const delivery of deliveries) {
    const { fraudScore, isFlagged, flags } = await analyzeDelivery(delivery);

    if (flags.length > 0) {
      delivery.fraudScore = fraudScore;
      delivery.isFlagged = isFlagged;
      delivery.fraudFlags = flags;
      await delivery.save();
      results.push({ deliveryId: delivery._id, fraudScore, isFlagged, flags });
    }
  }

  logger.info(`Fraud scan complete. Checked ${deliveries.length} deliveries, flagged ${results.filter(r => r.isFlagged).length}`);
  return { scanned: deliveries.length, flagged: results.filter((r) => r.isFlagged).length, results };
}

// ─── Get Fraud Alerts ─────────────────────────────────────────────────────────
async function getFraudAlerts() {
  return Delivery.find({ isFlagged: true })
    .populate('volunteer', 'name phone trustScore')
    .populate('donor', 'name')
    .populate('ngo', 'name ngoName')
    .sort({ fraudScore: -1 })
    .limit(50);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateRouteDistance(routePoints) {
  let total = 0;
  for (let i = 1; i < routePoints.length; i++) {
    total += haversineDistance(
      routePoints[i - 1].coordinates,
      routePoints[i].coordinates
    );
  }
  return total;
}

module.exports = { analyzeDelivery, runGlobalFraudScan, getFraudAlerts };

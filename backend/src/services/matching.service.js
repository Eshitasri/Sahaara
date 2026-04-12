/**
 * AI Matching Service
 * Implements K-Nearest Neighbor matching between donations and NGO requests,
 * and finds the best available volunteer for a delivery.
 */

const User = require('../models/User.model');
const Donation = require('../models/Donation.model');
const Request = require('../models/Request.model');
const logger = require('../utils/logger');

// ─── Haversine Distance (km) ─────────────────────────────────────────────────
function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Category match score (0-1) ───────────────────────────────────────────────
function categoryMatchScore(donationCategory, requestCategory) {
  if (donationCategory === requestCategory) return 1.0;

  // Partial matches (e.g. food_cooked can satisfy food_raw request if nothing else)
  const partialMatches = {
    food_cooked: ['food_raw'],
    food_raw: ['food_cooked'],
  };
  if (partialMatches[donationCategory]?.includes(requestCategory)) return 0.6;
  return 0;
}

// ─── Urgency multiplier ───────────────────────────────────────────────────────
function urgencyMultiplier(urgency) {
  return { low: 0.6, medium: 0.8, high: 1.0, critical: 1.3 }[urgency] || 0.8;
}

// ─── Match Donation → Best NGO Request ───────────────────────────────────────
async function matchDonationToRequest(donationId) {
  const donation = await Donation.findById(donationId);
  if (!donation || donation.status !== 'available') {
    throw new Error('Donation not available for matching.');
  }

  const openRequests = await Request.find({ status: 'open' }).populate('ngo', 'name city');
  if (openRequests.length === 0) return { matched: false, message: 'No open NGO requests available.' };

  const scored = openRequests.map((request) => {
    const distKm = haversineDistance(
      donation.pickupLocation.coordinates,
      request.deliveryLocation.coordinates
    );

    const catScore = categoryMatchScore(donation.category, request.category);
    if (catScore === 0) return null; // incompatible categories

    // Composite score: lower is better for distance, higher is better for rest
    // Normalise distance: assume max useful range = 50km
    const distScore = Math.max(0, 1 - distKm / 50);
    const urgency = urgencyMultiplier(request.urgency);

    // Weighted scoring
    const score = (distScore * 0.4 + catScore * 0.3 + urgency * 0.3).toFixed(4);

    return { request, distKm: distKm.toFixed(2), catScore, urgency, score: parseFloat(score) };
  });

  const valid = scored.filter(Boolean).sort((a, b) => b.score - a.score);
  if (valid.length === 0) return { matched: false, message: 'No category-compatible requests found.' };

  const best = valid[0];
  logger.info(`Match found: Donation ${donationId} → Request ${best.request._id} (score: ${best.score})`);

  return {
    matched: true,
    request: best.request,
    matchScore: best.score,
    distanceKm: best.distKm,
    allCandidates: valid.slice(0, 5), // top 5 for transparency
  };
}

// ─── Find Best Volunteer ───────────────────────────────────────────────────────
async function findBestVolunteer(donorCoords, ngoCoords) {
  // Find volunteers who are active, available, and near the donor
  const MAX_RADIUS_KM = 20;

  const volunteers = await User.find({
    role: 'volunteer',
    status: 'active',
    isAvailable: true,
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: donorCoords },
        $maxDistance: MAX_RADIUS_KM * 1000, // metres
      },
    },
  }).limit(20);

  if (volunteers.length === 0) {
    return { found: false, message: 'No available volunteers nearby.' };
  }

  const scored = volunteers.map((v) => {
    const distToDonor = haversineDistance(v.location.coordinates, donorCoords);
    const distToNgo = haversineDistance(donorCoords, ngoCoords);
    const totalRoute = distToDonor + distToNgo;

    // Normalise distance (max 30km assumed)
    const distScore = Math.max(0, 1 - distToDonor / 30);
    const trustNorm = v.trustScore / 10;
    const experienceNorm = Math.min(v.successfulDeliveries / 50, 1); // cap at 50

    const score = (distScore * 0.4 + trustNorm * 0.4 + experienceNorm * 0.2).toFixed(4);

    return {
      volunteer: v,
      distToDonorKm: distToDonor.toFixed(2),
      totalRouteKm: totalRoute.toFixed(2),
      score: parseFloat(score),
      matchReason: `Dist: ${distToDonor.toFixed(1)}km | Trust: ${v.trustScore} | Deliveries: ${v.successfulDeliveries}`,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  logger.info(`Best volunteer: ${best.volunteer.name} (score: ${best.score})`);

  return {
    found: true,
    volunteer: best.volunteer,
    matchScore: best.score,
    matchReason: best.matchReason,
    distToDonorKm: best.distToDonorKm,
    totalRouteKm: best.totalRouteKm,
    allCandidates: scored.slice(0, 3),
  };
}

// ─── Demand Clustering (simple grid-based K-Means) ───────────────────────────
async function analyzeDemand() {
  const requests = await Request.find({ status: 'open' });

  // Group by category
  const byCategory = {};
  requests.forEach((r) => {
    if (!byCategory[r.category]) byCategory[r.category] = { count: 0, urgencySum: 0, locations: [] };
    byCategory[r.category].count++;
    byCategory[r.category].urgencySum += urgencyMultiplier(r.urgency);
    byCategory[r.category].locations.push(r.deliveryLocation.coordinates);
  });

  const donations = await Donation.find({ status: 'available' });
  const surplusByCategory = {};
  donations.forEach((d) => {
    surplusByCategory[d.category] = (surplusByCategory[d.category] || 0) + 1;
  });

  const analysis = Object.entries(byCategory).map(([cat, data]) => ({
    category: cat,
    demandCount: data.count,
    surplusCount: surplusByCategory[cat] || 0,
    gap: data.count - (surplusByCategory[cat] || 0),
    avgUrgency: (data.urgencySum / data.count).toFixed(2),
    hotspots: computeHotspots(data.locations),
  }));

  return { analysis, generatedAt: new Date() };
}

// Simple centroid calculation for hotspots
function computeHotspots(locations) {
  if (locations.length === 0) return [];
  const avgLng = locations.reduce((s, c) => s + c[0], 0) / locations.length;
  const avgLat = locations.reduce((s, c) => s + c[1], 0) / locations.length;
  return [{ lng: avgLng.toFixed(4), lat: avgLat.toFixed(4), count: locations.length }];
}

module.exports = { matchDonationToRequest, findBestVolunteer, analyzeDemand, haversineDistance };

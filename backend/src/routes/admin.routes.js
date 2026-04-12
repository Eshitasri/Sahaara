// ─── admin.routes.js ──────────────────────────────────────────────────────────
const express = require('express');
const adminRouter = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const User = require('../models/User.model');
const Donation = require('../models/Donation.model');
const Request = require('../models/Request.model');
const Delivery = require('../models/Delivery.model');

adminRouter.use(protect, restrictTo('admin'));

// Dashboard stats
adminRouter.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers, totalDonors, totalNgos, totalVolunteers,
      totalDonations, availableDonations,
      totalRequests, openRequests,
      totalDeliveries, deliveredCount, flaggedDeliveries,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      User.countDocuments({ role: 'volunteer' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'available' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'open' }),
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: 'delivered' }),
      Delivery.countDocuments({ isFlagged: true }),
    ]);

    const recentDeliveries = await Delivery.find()
      .populate('volunteer', 'name')
      .populate('ngo', 'name ngoName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, donors: totalDonors, ngos: totalNgos, volunteers: totalVolunteers },
        donations: { total: totalDonations, available: availableDonations },
        requests: { total: totalRequests, open: openRequests },
        deliveries: { total: totalDeliveries, delivered: deliveredCount, flagged: flaggedDeliveries },
        successRate: totalDeliveries ? ((deliveredCount / totalDeliveries) * 100).toFixed(1) : 0,
      },
      recentDeliveries,
    });
  } catch (err) { next(err); }
});

// List all users
adminRouter.get('/users', async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total: await User.countDocuments(filter), users });
  } catch (err) { next(err); }
});

// Update user status
adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// Reassign a delivery to another volunteer
adminRouter.patch('/deliveries/:id/reassign', async (req, res, next) => {
  try {
    const { volunteerId } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { volunteer: volunteerId, status: 'volunteer_notified', assignedAt: new Date() },
      { new: true }
    ).populate('volunteer', 'name');

    // Free up old volunteer, mark new one unavailable
    await User.findByIdAndUpdate(volunteerId, { isAvailable: false });

    const io = req.app.get('io');
    io?.to(`user_${volunteerId}`).emit('delivery_assigned', { deliveryId: delivery._id });

    res.json({ success: true, message: 'Delivery reassigned.', delivery });
  } catch (err) { next(err); }
});

module.exports = adminRouter;


// ─── volunteer.routes.js (exported separately below) ─────────────────────────
const volunteerRouter = express.Router();

volunteerRouter.use(protect);

// Get available deliveries near volunteer
volunteerRouter.get('/available-deliveries', restrictTo('volunteer'), async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({ status: 'pending_volunteer' })
      .populate('donation', 'category title quantity pickupAddress pickupLocation')
      .populate('ngo', 'name ngoName city')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, deliveries });
  } catch (err) { next(err); }
});

// Volunteer picks up an unassigned delivery
volunteerRouter.post('/claim/:deliveryId', restrictTo('volunteer'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.deliveryId, status: 'pending_volunteer' });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not available.' });

    delivery.volunteer = req.user.id;
    delivery.status = 'volunteer_accepted';
    delivery.acceptedAt = new Date();
    delivery.assignedAt = new Date();
    await delivery.save();

    await User.findByIdAndUpdate(req.user.id, { isAvailable: false });

    res.json({ success: true, message: 'Delivery claimed.', delivery });
  } catch (err) { next(err); }
});

// Update volunteer availability
volunteerRouter.patch('/availability', restrictTo('volunteer'), async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    await User.findByIdAndUpdate(req.user.id, { isAvailable });
    res.json({ success: true, message: `You are now ${isAvailable ? 'available' : 'offline'}.` });
  } catch (err) { next(err); }
});

// Get volunteer leaderboard
volunteerRouter.get('/leaderboard', async (req, res, next) => {
  try {
    const volunteers = await User.find({ role: 'volunteer', status: 'active' })
      .select('name trustScore successfulDeliveries totalDeliveries city averageRating')
      .sort({ trustScore: -1 })
      .limit(20);

    res.json({ success: true, volunteers });
  } catch (err) { next(err); }
});

// Export both routers
module.exports = adminRouter;

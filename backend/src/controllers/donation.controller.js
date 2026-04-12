const Donation = require('../models/Donation.model');
const { matchDonationToRequest } = require('../services/matching.service');

// Create donation
exports.createDonation = async (req, res, next) => {
  try {
    const { category, title, description, quantity, estimatedServings,
            pickupAddress, latitude, longitude, pickupWindowStart, pickupWindowEnd, expiryDate } = req.body;

    const photos = req.files?.map((f) => f.path) || []; // Cloudinary URLs via multer

    const donation = await Donation.create({
      donor: req.user.id,
      category, title, description, quantity,
      estimatedServings, expiryDate,
      photos,
      pickupAddress,
      pickupLocation: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      pickupWindowStart, pickupWindowEnd,
    });

    // Trigger auto-matching in background
    setImmediate(async () => {
      try {
        const match = await matchDonationToRequest(donation._id);
        if (match.matched) {
          const io = req.app.get('io');
          io?.to('admin').emit('new_match', { donationId: donation._id, requestId: match.request._id });
        }
      } catch (e) { /* silent */ }
    });

    res.status(201).json({ success: true, donation });
  } catch (err) { next(err); }
};

// Get all donations (with filters)
exports.getDonations = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Donors see only their own
    if (req.user.role === 'donor') filter.donor = req.user.id;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const donations = await Donation.find(filter)
      .populate('donor', 'name city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Donation.countDocuments(filter);

    res.json({ success: true, total, page: Number(page), donations });
  } catch (err) { next(err); }
};

// Get single donation
exports.getDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name phone city');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
    res.json({ success: true, donation });
  } catch (err) { next(err); }
};

// Update donation
exports.updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    Object.assign(donation, req.body);
    await donation.save();
    res.json({ success: true, donation });
  } catch (err) { next(err); }
};

// Cancel donation
exports.cancelDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
    donation.status = 'cancelled';
    await donation.save();
    res.json({ success: true, message: 'Donation cancelled.' });
  } catch (err) { next(err); }
};

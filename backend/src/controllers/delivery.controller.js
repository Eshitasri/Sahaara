const Delivery = require('../models/Delivery.model');
const Donation = require('../models/Donation.model');
const Request = require('../models/Request.model');
const User = require('../models/User.model');
const otpService = require('../services/otp.service');
const fraudService = require('../services/fraud.service');

// Create/assign delivery after matching
exports.createDelivery = async (req, res, next) => {
  try {
    const { donationId, requestId } = req.body;

    const donation = await Donation.findById(donationId);
    const request = await Request.findById(requestId);

    if (!donation || donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Donation not available.' });
    }
    if (!request || request.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Request not open.' });
    }

    // Find best volunteer
    const matchService = require('../services/matching.service');
    const volunteerMatch = await matchService.findBestVolunteer(
      donation.pickupLocation.coordinates,
      request.deliveryLocation.coordinates
    );

    const delivery = await Delivery.create({
      donation: donationId,
      request: requestId,
      donor: donation.donor,
      ngo: request.ngo,
      volunteer: volunteerMatch.found ? volunteerMatch.volunteer._id : undefined,
      status: volunteerMatch.found ? 'volunteer_notified' : 'pending_volunteer',
      matchScore: volunteerMatch.matchScore,
      matchReason: volunteerMatch.matchReason,
      assignedAt: volunteerMatch.found ? new Date() : undefined,
      expectedPickupTime: new Date(Date.now() + 60 * 60 * 1000),   // 1 hour
      expectedDeliveryTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
    });

    // Update statuses
    donation.status = 'matched';
    donation.delivery = delivery._id;
    donation.matchedNgo = request.ngo;
    await donation.save();

    request.status = 'matched';
    request.matchedDonations.push(donationId);
    await request.save();

    // Mark volunteer as unavailable
    if (volunteerMatch.found) {
      await User.findByIdAndUpdate(volunteerMatch.volunteer._id, { isAvailable: false });
    }

    // Notify via Socket.io
    const io = req.app.get('io');
    io?.to(`user_${donation.donor}`).emit('donation_matched', { deliveryId: delivery._id });
    io?.to(`user_${request.ngo}`).emit('request_matched', { deliveryId: delivery._id });
    if (volunteerMatch.found) {
      io?.to(`user_${volunteerMatch.volunteer._id}`).emit('delivery_assigned', { deliveryId: delivery._id });
    }

    res.status(201).json({ success: true, delivery, volunteerMatch });
  } catch (err) { next(err); }
};

// Volunteer: Accept delivery
exports.acceptDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    if (delivery.volunteer?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your delivery.' });
    }

    delivery.status = 'volunteer_accepted';
    delivery.acceptedAt = new Date();

    // Generate pickup OTP and send to donor
    const { otp, hash, expiry } = await otpService.generateDeliveryOtp(delivery._id);
    delivery.pickupOtp = hash;
    delivery.pickupOtpExpiry = expiry;
    await delivery.save();

    const donor = await User.findById(delivery.donor);
    await otpService.sendSms(donor.phone, `Volunteer is on the way to pick up your donation. Pickup OTP: ${otp}. Share only when they arrive.`);

    delivery.status = 'pickup_otp_sent';
    await delivery.save();

    res.json({ success: true, message: 'Delivery accepted. Pickup OTP sent to donor.' });
  } catch (err) { next(err); }
};

// Volunteer: Confirm pickup (OTP + photo)
exports.confirmPickup = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });

    if (new Date() > delivery.pickupOtpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }

    if (!otpService.verifyOtpHash(otp, delivery.pickupOtp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    delivery.status = 'in_transit';
    delivery.pickedUpAt = new Date();
    delivery.pickupPhotoUrl = req.file?.path || null;
    delivery.pickupOtp = undefined;
    await delivery.save();

    await Donation.findByIdAndUpdate(delivery.donation, { status: 'pickup_confirmed' });

    const io = req.app.get('io');
    io?.to(`user_${delivery.ngo}`).emit('pickup_confirmed', { deliveryId: delivery._id });

    res.json({ success: true, message: 'Pickup confirmed. En route to NGO.' });
  } catch (err) { next(err); }
};

// NGO: Confirm delivery received
exports.confirmDelivery = async (req, res, next) => {
  try {
    const { otp, rating, feedback } = req.body;
    const delivery = await Delivery.findById(req.params.id).populate('volunteer');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });

    if (delivery.ngo.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    delivery.deliveryPhotoUrl = req.file?.path || null;
    delivery.ngoRating = rating;
    delivery.ngoFeedback = feedback;
    await delivery.save();

    await Donation.findByIdAndUpdate(delivery.donation, { status: 'delivered' });

    // Update volunteer trust score
    if (delivery.volunteer) {
      const vol = await User.findById(delivery.volunteer._id);
      vol.updateTrustScore(true, rating);
      vol.isAvailable = true;
      await vol.save();
    }

    // Run fraud analysis in background
    setImmediate(async () => {
      try {
        const fullDelivery = await Delivery.findById(delivery._id)
          .populate('donation', 'pickupLocation')
          .populate('request', 'deliveryLocation');
        const result = await fraudService.analyzeDelivery(fullDelivery);
        await Delivery.findByIdAndUpdate(delivery._id, {
          fraudScore: result.fraudScore,
          isFlagged: result.isFlagged,
          fraudFlags: result.flags,
        });
      } catch (e) { /* silent */ }
    });

    res.json({ success: true, message: 'Delivery confirmed. Thank you!' });
  } catch (err) { next(err); }
};

// Get deliveries (filtered by role)
exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'donor') filter.donor = req.user.id;
    if (req.user.role === 'ngo') filter.ngo = req.user.id;
    if (req.user.role === 'volunteer') filter.volunteer = req.user.id;
    if (status) filter.status = status;

    const deliveries = await Delivery.find(filter)
      .populate('donation', 'category title quantity')
      .populate('donor', 'name phone city')
      .populate('ngo', 'name ngoName city')
      .populate('volunteer', 'name phone trustScore')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, deliveries });
  } catch (err) { next(err); }
};

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const otpService = require('../services/otp.service');
const logger = require('../utils/logger');

// Generate JWT
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, ngoName, ngoRegistrationNumber, city, state, address } = req.body;

    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or phone already registered.' });
    }

    // Create user
    const user = await User.create({
      name, email, phone, password, role,
      ngoName, ngoRegistrationNumber,
      city, state, address,
      status: 'pending',
    });

    // Send OTP
    const otp = await otpService.generateAndSendOtp(user);
    user.otp = otp.hash;
    user.otpExpiry = otp.expiry;
    await user.save();

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone with the OTP sent.',
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please register again.' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    user.isVerified = true;
    user.status = 'active';
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = signToken(user._id);

    logger.info(`User verified: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = await otpService.generateAndSendOtp(user);
    user.otp = otp.hash;
    user.otpExpiry = otp.expiry;
    await user.save();

    res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your phone number first.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact admin.' });
    }

    const token = signToken(user._id);
    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── Update Location (Volunteers) ─────────────────────────────────────────────
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      location: { type: 'Point', coordinates: [longitude, latitude] },
    });
    res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    next(err);
  }
};

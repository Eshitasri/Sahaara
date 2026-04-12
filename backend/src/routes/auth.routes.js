// ─── auth.routes.js ───────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.patch('/location', protect, authController.updateLocation);

module.exports = router;

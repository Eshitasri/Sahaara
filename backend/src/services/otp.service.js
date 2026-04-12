const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * OTP Service
 * Generates OTPs and sends via Twilio SMS (or logs in dev mode).
 */

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

async function generateAndSendOtp(user) {
  const otp = generateOtp();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await sendSms(user.phone, `Your AI Resource Distribution OTP is: ${otp}. Valid for 10 minutes.`);

  logger.info(`OTP sent to ${user.phone} (DEV: ${otp})`);

  return { hash, expiry };
}

async function sendSms(phone, message) {
  if (process.env.NODE_ENV === 'production') {
    // Use Twilio in production
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } else {
    // Log to console in development
    logger.info(`[DEV SMS to ${phone}]: ${message}`);
  }
}

// Generate a short numeric OTP for pickup/delivery confirmation
async function generateDeliveryOtp(deliveryId) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return { otp, hash, expiry };
}

function verifyOtpHash(inputOtp, storedHash) {
  const hash = crypto.createHash('sha256').update(inputOtp).digest('hex');
  return hash === storedHash;
}

module.exports = { generateAndSendOtp, generateDeliveryOtp, verifyOtpHash, sendSms };

const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
      type: String,
      enum: [
        'pending_volunteer',   // waiting for volunteer assignment
        'volunteer_notified',  // volunteer got alert
        'volunteer_accepted',  // volunteer accepted
        'pickup_otp_sent',     // OTP sent to donor
        'pickup_confirmed',    // pickup done (photo + OTP verified)
        'in_transit',          // en route to NGO
        'delivered',           // received by NGO
        'failed',              // delivery failed
        'cancelled',           // cancelled by admin
      ],
      default: 'pending_volunteer',
    },

    // OTPs
    pickupOtp: { type: String },
    pickupOtpExpiry: { type: Date },
    deliveryOtp: { type: String },
    deliveryOtpExpiry: { type: Date },

    // Photo proofs
    pickupPhotoUrl: { type: String },
    deliveryPhotoUrl: { type: String },

    // Timestamps
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },

    // GPS tracking
    volunteerRoutePoints: [
      {
        coordinates: [Number], // [lng, lat]
        recordedAt: Date,
      },
    ],

    // Expected vs actual
    expectedPickupTime: { type: Date },
    expectedDeliveryTime: { type: Date },
    actualDistance: { type: Number }, // in km

    // Fraud flags
    fraudFlags: [
      {
        type: { type: String },
        description: String,
        detectedAt: { type: Date, default: Date.now },
      },
    ],
    fraudScore: { type: Number, default: 0 }, // 0-100, higher = more suspicious
    isFlagged: { type: Boolean, default: false },

    // Ratings
    donorRating: { type: Number, min: 1, max: 5 },
    ngoRating: { type: Number, min: 1, max: 5 },
    donorFeedback: { type: String },
    ngoFeedback: { type: String },

    // AI match data
    matchScore: { type: Number }, // score assigned by matching algorithm
    matchReason: { type: String }, // why this volunteer was chosen
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);

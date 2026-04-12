const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    category: {
      type: String,
      enum: ['food_cooked', 'food_raw', 'clothes', 'medicines', 'books', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    quantityNeeded: { type: String, required: true },
    beneficiariesCount: { type: Number, required: true },

    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    // Delivery location
    deliveryAddress: { type: String, required: true },
    deliveryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    neededBy: { type: Date },

    status: {
      type: String,
      enum: ['open', 'partially_matched', 'matched', 'fulfilled', 'cancelled'],
      default: 'open',
    },

    // Matched donations
    matchedDonations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }],

    // AI computed priority score
    priorityScore: { type: Number, default: 5 },
    aiCluster: { type: String }, // which demand cluster this belongs to
  },
  { timestamps: true }
);

requestSchema.index({ deliveryLocation: '2dsphere' });
requestSchema.index({ status: 1, urgency: 1 });

module.exports = mongoose.model('Request', requestSchema);

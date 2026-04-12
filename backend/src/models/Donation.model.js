const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // What is being donated
    category: {
      type: String,
      enum: ['food_cooked', 'food_raw', 'clothes', 'medicines', 'books', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    quantity: { type: String, required: true }, // e.g. "5kg", "20 portions", "3 bags"
    estimatedServings: { type: Number }, // for food
    expiryDate: { type: Date }, // for perishables

    // Photos
    photos: [{ type: String }], // Cloudinary URLs

    // Pickup location
    pickupAddress: { type: String, required: true },
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    pickupWindowStart: { type: Date },
    pickupWindowEnd: { type: Date },

    // Status
    status: {
      type: String,
      enum: ['available', 'matched', 'pickup_confirmed', 'delivered', 'expired', 'cancelled'],
      default: 'available',
    },

    // Matched delivery
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    matchedNgo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // AI tags
    aiTags: [{ type: String }], // e.g. ['perishable', 'high-priority']
    priorityScore: { type: Number, default: 5 },
  },
  { timestamps: true }
);

donationSchema.index({ pickupLocation: '2dsphere' });
donationSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Donation', donationSchema);

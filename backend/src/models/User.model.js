const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer', 'admin'],
      required: true,
    },

    // Verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },

    // Profile
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    profilePhoto: { type: String },

    // GPS (for volunteers)
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    isAvailable: { type: Boolean, default: true }, // for volunteers

    // Trust score (for volunteers)
    trustScore: { type: Number, default: 5.0, min: 0, max: 10 },
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },

    // NGO specific
    ngoName: { type: String },
    ngoRegistrationNumber: { type: String },
    ngoDocumentUrl: { type: String },

    // Status
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },

    // Ratings
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for geo queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update trust score after delivery
userSchema.methods.updateTrustScore = function (deliverySuccess, rating) {
  this.totalDeliveries += 1;
  if (deliverySuccess) this.successfulDeliveries += 1;

  const successRate = this.successfulDeliveries / this.totalDeliveries;
  const ratingWeight = rating ? (rating / 5) * 10 : this.trustScore;
  this.trustScore = Math.min(10, (successRate * 7 + ratingWeight * 0.3).toFixed(1));
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

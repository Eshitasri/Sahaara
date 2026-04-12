/**
 * Seed script — populates the database with sample data for testing.
 * Run: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Donation = require('../models/Donation.model');
const Request = require('../models/Request.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://eshitasug24mae_db_user:1234567890qwerty@cluster0.gidmvjd.mongodb.net/MyWebDB?retryWrites=true&w=majority';

const sampleUsers = [
  { name: 'Admin User', email: 'admin@example.com', phone: '+919000000000', password: 'Admin@123', role: 'admin', isVerified: true, status: 'active' },
  { name: 'Priya Sharma', email: 'priya@donor.com', phone: '+919111111111', password: 'Donor@123', role: 'donor', isVerified: true, status: 'active', city: 'Lucknow', address: 'Gomti Nagar' },
  { name: 'Meena Tiwari', email: 'meena@donor.com', phone: '+919111111112', password: 'Donor@123', role: 'donor', isVerified: true, status: 'active', city: 'Lucknow', address: 'Indira Nagar' },
  {
    name: 'CareNGO Admin', email: 'care@ngo.com', phone: '+919222222221', password: 'NGO@1234', role: 'ngo',
    isVerified: true, status: 'active', ngoName: 'CareNGO', ngoRegistrationNumber: 'NGO-LKO-001', city: 'Lucknow',
  },
  {
    name: 'HopeHouse Admin', email: 'hope@ngo.com', phone: '+919222222222', password: 'NGO@1234', role: 'ngo',
    isVerified: true, status: 'active', ngoName: 'HopeHouse', ngoRegistrationNumber: 'NGO-LKO-002', city: 'Lucknow',
  },
  {
    name: 'Arjun Kumar', email: 'arjun@vol.com', phone: '+919333333331', password: 'Vol@1234', role: 'volunteer',
    isVerified: true, status: 'active', trustScore: 9.2, successfulDeliveries: 47, totalDeliveries: 50, isAvailable: true,
    city: 'Lucknow', location: { type: 'Point', coordinates: [80.9462, 26.8467] },
  },
  {
    name: 'Sunita Mishra', email: 'sunita@vol.com', phone: '+919333333332', password: 'Vol@1234', role: 'volunteer',
    isVerified: true, status: 'active', trustScore: 8.7, successfulDeliveries: 33, totalDeliveries: 37, isAvailable: true,
    city: 'Lucknow', location: { type: 'Point', coordinates: [80.9560, 26.8600] },
  },
  {
    name: 'Pankaj Yadav', email: 'pankaj@vol.com', phone: '+919333333333', password: 'Vol@1234', role: 'volunteer',
    isVerified: true, status: 'active', trustScore: 8.1, successfulDeliveries: 20, totalDeliveries: 24, isAvailable: true,
    city: 'Lucknow', location: { type: 'Point', coordinates: [80.9200, 26.8300] },
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Donation.deleteMany(), Request.deleteMany()]);
  console.log('Cleared existing data');

  // Create users (password hashing via pre-save hook)
  const users = await User.create(sampleUsers);
  console.log(`Created ${users.length} users`);

  const donor1 = users.find(u => u.email === 'priya@donor.com');
  const donor2 = users.find(u => u.email === 'meena@donor.com');
  const ngo1 = users.find(u => u.email === 'care@ngo.com');
  const ngo2 = users.find(u => u.email === 'hope@ngo.com');

  // Create sample donations
  const donations = await Donation.create([
    {
      donor: donor1._id, category: 'food_raw', title: 'Rice and Dal Bundle',
      description: '5kg basmati rice and 2kg toor dal', quantity: '7kg',
      pickupAddress: 'Gomti Nagar, Lucknow', status: 'available',
      pickupLocation: { type: 'Point', coordinates: [80.9462, 26.8467] },
    },
    {
      donor: donor2._id, category: 'clothes', title: 'Winter Clothes Bundle',
      description: 'Assorted winter clothes, good condition', quantity: '3 bags',
      pickupAddress: 'Indira Nagar, Lucknow', status: 'available',
      pickupLocation: { type: 'Point', coordinates: [80.9560, 26.8600] },
    },
    {
      donor: donor1._id, category: 'food_cooked', title: 'Cooked Meals',
      description: 'Dal, rice, sabzi — 20 portions', quantity: '20 portions', estimatedServings: 20,
      pickupAddress: 'Hazratganj, Lucknow', status: 'available',
      pickupLocation: { type: 'Point', coordinates: [80.9462, 26.8550] },
    },
  ]);
  console.log(`Created ${donations.length} donations`);

  // Create sample NGO requests
  const requests = await Request.create([
    {
      ngo: ngo1._id, category: 'food_raw', title: 'Need Rice and Pulses',
      description: 'For 50 daily meals at shelter', quantityNeeded: '10kg', beneficiariesCount: 50,
      urgency: 'high', deliveryAddress: 'Chowk, Lucknow',
      deliveryLocation: { type: 'Point', coordinates: [80.9200, 26.8700] },
      priorityScore: 8,
    },
    {
      ngo: ngo2._id, category: 'clothes', title: 'Winter Clothes for Children',
      description: 'Needed urgently for 30 children at orphanage', quantityNeeded: '2 bags', beneficiariesCount: 30,
      urgency: 'critical', deliveryAddress: 'Mahanagar, Lucknow',
      deliveryLocation: { type: 'Point', coordinates: [80.9300, 26.8800] },
      priorityScore: 10,
    },
    {
      ngo: ngo1._id, category: 'food_cooked', title: 'Cooked Food for Evening',
      description: 'For 25 adults at community center', quantityNeeded: '25 portions', beneficiariesCount: 25,
      urgency: 'medium', deliveryAddress: 'Aliganj, Lucknow',
      deliveryLocation: { type: 'Point', coordinates: [80.9600, 26.8900] },
      priorityScore: 5,
    },
  ]);
  console.log(`Created ${requests.length} NGO requests`);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Admin:     admin@example.com  /  Admin@123');
  console.log('  Donor:     priya@donor.com    /  Donor@123');
  console.log('  NGO:       care@ngo.com       /  NGO@1234');
  console.log('  Volunteer: arjun@vol.com      /  Vol@1234');
  console.log('─────────────────────────────────');

  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });

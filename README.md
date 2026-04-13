# 🌿 Sahaara — Welfare Network

> *Connecting surplus to scarcity, and kindness to the needy.*

A full-stack AI-powered web platform that bridges **Donors**, **NGOs**, and **Volunteers** to streamline resource distribution using smart matching algorithms, demand analysis, and fraud detection.

🔗 **Live Demo**: [https://sahaara-ebon.vercel.app](https://sahaara-ebon.vercel.app)

---

## 🏗 Project Structure

```
Sahaara/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # MongoDB models (Mongoose)
│   │   ├── routes/           # API route definitions
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── services/         # AI matching, fraud detection, OTP
│   │   └── utils/            # Helpers, seed script
│   ├── config/               # DB, JWT, environment config
│   └── server.js             # Entry point
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Donor, NGO, Volunteer, Admin pages
│   │   ├── services/         # API client (Axios)
│   │   └── context/          # Auth & App state (React Context)
│   └── public/
├── database/
│   └── schema.sql            # PostgreSQL schema (reference)
└── docs/
    └── API.md                # Full API documentation
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Authentication | JWT + OTP via Twilio |
| AI Matching | K-Nearest Neighbor (custom JS implementation) |
| Fraud Detection | Rule-based + anomaly scoring |
| GPS | Browser Geolocation API + Google Maps |
| Real-time | Socket.io |
| File Upload | Multer + Cloudinary |
| Email/SMS | Nodemailer + Twilio |
| AI Assistant | Anthropic Claude API |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/Eshitasri/Sahaara.git
cd Sahaara

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ANTHROPIC_API_KEY=your_anthropic_key
FRONTEND_URL=http://localhost:3000
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates sample users, donations, and NGO requests with the following credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Donor | priya@donor.com | Donor@123 |
| NGO | care@ngo.com | NGO@1234 |
| Volunteer | arjun@vol.com | Vol@1234 |

### 4. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

- App: http://localhost:3000
- API: http://localhost:5000

---

## 👥 User Roles

### 🤲 Donor
- Register & verify identity via OTP
- Upload food, clothes, medicine donations
- Track donation delivery status
- View impact dashboard

### 🏢 NGO
- Register organisation & get verified
- Submit resource requests
- Track matched donations in real-time
- Rate volunteer performance

### 🚴 Volunteer
- Register & enable GPS location
- Accept/reject delivery assignments
- Confirm pickup with Photo + OTP
- Build trust score over time

### 🛡 Admin
- View fraud detection alerts
- Suspend flagged accounts
- Reassign deliveries
- View full analytics dashboard

---

## 🤖 AI Features

### 1. Demand Analysis (Clustering)
- Groups NGO requests by location and category
- Predicts upcoming demand based on historical patterns
- Uses K-Means clustering to identify hotspots

### 2. Smart Matching Algorithm
- Finds nearest volunteer to donor location via GPS
- Weighted scoring: Distance (40%) + Trust Score (30%) + Category Match (30%)
- Average match time: < 2 seconds

### 3. Fraud Detection
- Checks delivery time vs expected time
- Detects GPS drift and location anomalies
- OTP mismatch flagging
- Repeated offense tracking → auto-suspend

---

## 📡 API Overview

See [`docs/API.md`](./docs/API.md) for full documentation.

```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login
POST   /api/auth/verify-otp        Verify OTP

POST   /api/donations              Create donation
GET    /api/donations              List donations
GET    /api/donations/:id          Get donation

POST   /api/requests               Create NGO request
GET    /api/requests               List requests

GET    /api/match/:donationId      Run AI matching
POST   /api/deliveries             Assign delivery
PATCH  /api/deliveries/:id/pickup  Confirm pickup
PATCH  /api/deliveries/:id/deliver Confirm delivery

GET    /api/fraud/alerts           Get fraud alerts
POST   /api/fraud/scan             Run fraud scan
GET    /api/admin/dashboard        Admin dashboard
```

---

## 🗄 Database Collections

- **users** — Donors, NGOs, Volunteers, Admins
- **donations** — Items available for distribution
- **requests** — NGO resource requests
- **deliveries** — Matched + in-progress deliveries
- **fraud_logs** — Suspicious activity records
- **ratings** — Post-delivery ratings

---

## 📦 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Media Storage | Cloudinary |

🔗 Live: [https://sahaara-ebon.vercel.app](https://sahaara-ebon.vercel.app)

---

## 📄 License

MIT License — Free to use and modify.

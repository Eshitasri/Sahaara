# AI-Powered Resource Distribution System

A full-stack web application that connects **Donors**, **NGOs**, and **Volunteers** using AI-based demand analysis, smart matching algorithms, and fraud detection.

---

## 🏗 Project Structure

```
ai-resource-distribution/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # MongoDB models (Mongoose)
│   │   ├── routes/           # API route definitions
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── services/         # AI matching, fraud detection, OTP
│   │   └── utils/            # Helpers, logger
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
│   └── schema.sql            # PostgreSQL schema (alternative to MongoDB)
├── docs/
│   └── API.md                # Full API documentation
└── docker-compose.yml        # One-command setup
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Authentication | JWT + OTP via Twilio |
| AI Matching | K-Nearest Neighbor (custom JS implementation) |
| Fraud Detection | Rule-based + anomaly scoring |
| GPS | Browser Geolocation API + Google Maps |
| Real-time | Socket.io |
| File Upload | Multer + Cloudinary |
| Email/SMS | Nodemailer + Twilio |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
git clone <your-repo>
cd ai-resource-distribution

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your MongoDB URI, JWT secret, Twilio keys, etc.
```

### 3. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 4. Docker (One Command)

```bash
docker-compose up --build
```

App runs at: http://localhost:3000  
API runs at: http://localhost:5000

---

## 👥 User Roles

### Donor
- Register & verify identity (OTP)
- Upload food/clothes/medicine donations
- Track donation delivery status
- View impact dashboard

### NGO
- Register organisation & verify
- Submit resource requests (need data)
- Track matched donations in real-time
- Rate volunteer performance

### Volunteer
- Register & get GPS-enabled
- Accept/reject delivery assignments
- Confirm pickup (Photo + OTP)
- Build trust score over time

### Admin
- View fraud detection alerts
- Suspend flagged accounts
- Reassign deliveries
- View analytics dashboard

---

## 🤖 AI Features

### 1. Demand Analysis (Clustering)
- Groups NGO requests by location + category
- Predicts upcoming demand based on historical patterns
- Uses K-Means clustering to identify hotspots

### 2. Matching Algorithm
- Finds nearest volunteer to donor location (GPS)
- Weights: Distance (40%) + Trust Score (30%) + Category Match (30%)
- Average match time: < 2 seconds

### 3. Fraud Detection
- Checks delivery time vs expected time
- Detects GPS drift / location anomalies
- OTP mismatch flagging
- Repeated offense tracking → auto-suspend

---

## 📡 API Overview

See `docs/API.md` for full documentation.

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

- **Backend**: Railway / Render / AWS EC2
- **Frontend**: Vercel / Netlify
- **Database**: MongoDB Atlas
- **Media**: Cloudinary

---

## 📄 License

MIT License — Free to use and modify.

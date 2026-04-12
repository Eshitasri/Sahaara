-- ============================================================
-- AI Resource Distribution System — Data Schema Reference
-- (Shown as SQL for readability; actual DB is MongoDB/Mongoose)
-- ============================================================

-- USERS
-- roles: donor | ngo | volunteer | admin
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20)  UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            ENUM('donor','ngo','volunteer','admin') NOT NULL,
  is_verified     BOOLEAN DEFAULT FALSE,
  status          ENUM('active','suspended','pending') DEFAULT 'pending',

  -- Profile
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  profile_photo   TEXT,

  -- GPS (volunteers)
  gps_lng         DECIMAL(10,6),
  gps_lat         DECIMAL(10,6),
  is_available    BOOLEAN DEFAULT TRUE,

  -- Trust (volunteers)
  trust_score           DECIMAL(4,2) DEFAULT 5.0,
  total_deliveries      INT DEFAULT 0,
  successful_deliveries INT DEFAULT 0,
  average_rating        DECIMAL(3,2) DEFAULT 0,

  -- NGO fields
  ngo_name                VARCHAR(200),
  ngo_registration_number VARCHAR(100),
  ngo_document_url        TEXT,

  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- DONATIONS
CREATE TABLE donations (
  id               UUID PRIMARY KEY,
  donor_id         UUID REFERENCES users(id),
  category         ENUM('food_cooked','food_raw','clothes','medicines','books','other'),
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  quantity         VARCHAR(100) NOT NULL,
  estimated_servings INT,
  expiry_date      TIMESTAMP,

  -- Photos (array in MongoDB)
  photos           TEXT[], -- Cloudinary URLs

  -- Pickup
  pickup_address   TEXT NOT NULL,
  pickup_lng       DECIMAL(10,6) NOT NULL,
  pickup_lat       DECIMAL(10,6) NOT NULL,
  pickup_window_start TIMESTAMP,
  pickup_window_end   TIMESTAMP,

  -- Status
  status           ENUM('available','matched','pickup_confirmed','delivered','expired','cancelled') DEFAULT 'available',
  delivery_id      UUID,
  matched_ngo_id   UUID REFERENCES users(id),

  -- AI
  priority_score   INT DEFAULT 5,
  ai_tags          TEXT[],

  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- NGO REQUESTS
CREATE TABLE requests (
  id                   UUID PRIMARY KEY,
  ngo_id               UUID REFERENCES users(id),
  category             ENUM('food_cooked','food_raw','clothes','medicines','books','other'),
  title                VARCHAR(200) NOT NULL,
  description          TEXT,
  quantity_needed      VARCHAR(100) NOT NULL,
  beneficiaries_count  INT NOT NULL,
  urgency              ENUM('low','medium','high','critical') DEFAULT 'medium',

  -- Delivery location
  delivery_address     TEXT NOT NULL,
  delivery_lng         DECIMAL(10,6) NOT NULL,
  delivery_lat         DECIMAL(10,6) NOT NULL,
  needed_by            TIMESTAMP,

  -- Status
  status               ENUM('open','partially_matched','matched','fulfilled','cancelled') DEFAULT 'open',
  priority_score       INT DEFAULT 5,
  ai_cluster           VARCHAR(100),

  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- MATCHED DONATIONS (junction for request ↔ donations)
CREATE TABLE request_donations (
  request_id   UUID REFERENCES requests(id),
  donation_id  UUID REFERENCES donations(id),
  PRIMARY KEY (request_id, donation_id)
);

-- DELIVERIES
CREATE TABLE deliveries (
  id           UUID PRIMARY KEY,
  donation_id  UUID REFERENCES donations(id),
  request_id   UUID REFERENCES requests(id),
  donor_id     UUID REFERENCES users(id),
  ngo_id       UUID REFERENCES users(id),
  volunteer_id UUID REFERENCES users(id),

  status       ENUM(
    'pending_volunteer','volunteer_notified','volunteer_accepted',
    'pickup_otp_sent','pickup_confirmed','in_transit',
    'delivered','failed','cancelled'
  ) DEFAULT 'pending_volunteer',

  -- OTP (hashed)
  pickup_otp         TEXT,
  pickup_otp_expiry  TIMESTAMP,
  delivery_otp       TEXT,
  delivery_otp_expiry TIMESTAMP,

  -- Proofs
  pickup_photo_url   TEXT,
  delivery_photo_url TEXT,

  -- Timestamps
  assigned_at          TIMESTAMP,
  accepted_at          TIMESTAMP,
  picked_up_at         TIMESTAMP,
  delivered_at         TIMESTAMP,
  expected_pickup_time TIMESTAMP,
  expected_delivery_time TIMESTAMP,
  actual_distance_km   DECIMAL(8,2),

  -- Fraud
  fraud_score   INT DEFAULT 0,
  is_flagged    BOOLEAN DEFAULT FALSE,

  -- Ratings
  donor_rating   INT CHECK (donor_rating BETWEEN 1 AND 5),
  ngo_rating     INT CHECK (ngo_rating BETWEEN 1 AND 5),
  donor_feedback TEXT,
  ngo_feedback   TEXT,

  -- AI match
  match_score  DECIMAL(6,4),
  match_reason TEXT,

  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- GPS ROUTE POINTS (stored in delivery doc in MongoDB)
CREATE TABLE delivery_gps_points (
  id          UUID PRIMARY KEY,
  delivery_id UUID REFERENCES deliveries(id),
  lng         DECIMAL(10,6),
  lat         DECIMAL(10,6),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- FRAUD FLAGS (embedded in delivery doc in MongoDB)
CREATE TABLE fraud_flags (
  id          UUID PRIMARY KEY,
  delivery_id UUID REFERENCES deliveries(id),
  type        VARCHAR(100),
  description TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_donations_status_category ON donations(status, category);
CREATE INDEX idx_donations_location ON donations USING GIST (pickup_lng, pickup_lat);
CREATE INDEX idx_requests_status_urgency ON requests(status, urgency);
CREATE INDEX idx_requests_location ON requests USING GIST (delivery_lng, delivery_lat);
CREATE INDEX idx_users_location ON users USING GIST (gps_lng, gps_lat);
CREATE INDEX idx_deliveries_volunteer ON deliveries(volunteer_id);
CREATE INDEX idx_deliveries_flagged ON deliveries(is_flagged) WHERE is_flagged = TRUE;

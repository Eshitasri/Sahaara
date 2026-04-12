# API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Auth

### POST /auth/register
Register a new user.
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "+919876543210",
  "password": "Secure@123",
  "role": "donor",
  "city": "Lucknow",
  "address": "Gomti Nagar"
}
```
Response: `{ userId, message }`

### POST /auth/verify-otp
```json
{ "userId": "...", "otp": "123456" }
```
Response: `{ token, user }`

### POST /auth/resend-otp
```json
{ "userId": "..." }
```

### POST /auth/login
```json
{ "email": "...", "password": "..." }
```
Response: `{ token, user }`

### GET /auth/me *(protected)*
Returns current user profile.

### PATCH /auth/location *(protected, volunteer)*
```json
{ "latitude": 26.8467, "longitude": 80.9462 }
```

---

## Donations

### GET /donations *(protected)*
Query params: `status`, `category`, `page`, `limit`

### POST /donations *(donor only)*
Multipart form:
- `category` — food_cooked | food_raw | clothes | medicines | books | other
- `title`, `description`, `quantity`
- `pickupAddress`, `latitude`, `longitude`
- `photos[]` — up to 5 image files

### GET /donations/:id *(protected)*

### PATCH /donations/:id *(donor | admin)*

### DELETE /donations/:id/cancel *(donor | admin)*

---

## NGO Requests

### GET /requests *(protected)*
Query: `status`, `category`, `urgency`, `page`, `limit`

### POST /requests *(ngo only)*
```json
{
  "category": "food_raw",
  "title": "Rice for shelter",
  "quantityNeeded": "10kg",
  "beneficiariesCount": 50,
  "urgency": "high",
  "deliveryAddress": "Chowk, Lucknow",
  "latitude": 26.87,
  "longitude": 80.92
}
```

### GET /requests/:id *(protected)*

### PATCH /requests/:id *(ngo | admin)*

### DELETE /requests/:id/cancel *(ngo | admin)*

---

## Deliveries

### GET /deliveries *(protected)*
Returns deliveries scoped to the current user's role.

### POST /deliveries *(admin only)*
```json
{ "donationId": "...", "requestId": "..." }
```
Triggers AI volunteer matching automatically.

### PATCH /deliveries/:id/accept *(volunteer)*
Volunteer accepts the delivery. Triggers OTP to donor.

### PATCH /deliveries/:id/pickup *(volunteer)*
Multipart form: `otp` + optional `photo` file.
Confirms pickup, moves to in_transit.

### PATCH /deliveries/:id/deliver *(ngo)*
Multipart form: `otp`, `rating` (1-5), `feedback` + optional `photo`.
Confirms receipt. Triggers fraud analysis + trust update.

---

## AI Matching

### GET /match/donation/:donationId *(admin | donor)*
Runs AI match for a donation vs all open requests.
Returns top 5 candidates with scores.

### POST /match/volunteer *(admin)*
```json
{ "donorCoords": [80.94, 26.84], "ngoCoords": [80.92, 26.87] }
```
Returns best available volunteer.

### GET /match/demand-analysis *(admin)*
Returns clustering analysis: demand vs surplus by category.

---

## Fraud Detection

### GET /fraud/alerts *(admin)*
Returns all flagged deliveries sorted by fraud score.

### POST /fraud/scan *(admin)*
Runs fraud scan on all unreviewed recent deliveries.
Returns: `{ scanned, flagged, results }`

### GET /fraud/analyze/:deliveryId *(admin)*
Analyze a specific delivery for fraud indicators.

### PATCH /fraud/suspend/:userId *(admin)*
Suspends a flagged user account.

### PATCH /fraud/clear/:deliveryId *(admin)*
Clears fraud flag from a delivery (false positive).

---

## Admin

### GET /admin/dashboard *(admin)*
Returns full system stats: users, donations, requests, deliveries.

### GET /admin/users *(admin)*
Query: `role`, `status`, `page`, `limit`

### PATCH /admin/users/:id/status *(admin)*
```json
{ "status": "active" }
```
Values: `active` | `suspended` | `pending`

### PATCH /admin/deliveries/:id/reassign *(admin)*
```json
{ "volunteerId": "..." }
```

---

## Volunteers

### GET /volunteers/available-deliveries *(volunteer)*
Returns unassigned deliveries near the volunteer.

### POST /volunteers/claim/:deliveryId *(volunteer)*
Volunteer self-assigns an unassigned delivery.

### PATCH /volunteers/availability *(volunteer)*
```json
{ "isAvailable": true }
```

### GET /volunteers/leaderboard *(all)*
Returns top 20 volunteers by trust score.

---

## Socket.io Events

Connect to `http://localhost:5000`

### Client → Server
- `join_room(room)` — join a room (e.g. `"admin"`, `"delivery_<id>"`, `"user_<id>"`)
- `volunteer_location_update({ deliveryId, coordinates })` — broadcast GPS

### Server → Client
- `new_match` — a donation was matched to a request
- `donation_matched` — sent to donor
- `request_matched` — sent to NGO
- `delivery_assigned` — sent to volunteer
- `pickup_confirmed` — sent to NGO
- `location_updated` — GPS update from volunteer

---

## Error Format

All errors return:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

HTTP codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

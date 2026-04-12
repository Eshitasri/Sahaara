import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const verifyOtp = (data) => API.post('/auth/verify-otp', data);
export const resendOtp = (data) => API.post('/auth/resend-otp', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateLocation = (data) => API.patch('/auth/location', data);

// ─── Donations ────────────────────────────────────────────────────────────────
export const getDonations = (params) => API.get('/donations', { params });
export const getDonation = (id) => API.get(`/donations/${id}`);
export const createDonation = (formData) => API.post('/donations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const cancelDonation = (id) => API.delete(`/donations/${id}/cancel`);

// ─── Requests ─────────────────────────────────────────────────────────────────
export const getRequests = (params) => API.get('/requests', { params });
export const createRequest = (data) => API.post('/requests', data);
export const cancelRequest = (id) => API.delete(`/requests/${id}/cancel`);

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const getDeliveries = (params) => API.get('/deliveries', { params });
export const acceptDelivery = (id) => API.patch(`/deliveries/${id}/accept`);
export const confirmPickup = (id, formData) => API.patch(`/deliveries/${id}/pickup`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const confirmDelivery = (id, formData) => API.patch(`/deliveries/${id}/deliver`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ─── Match ────────────────────────────────────────────────────────────────────
export const matchDonation = (donationId) => API.get(`/match/donation/${donationId}`);
export const getDemandAnalysis = () => API.get('/match/demand-analysis');

// ─── Volunteers ───────────────────────────────────────────────────────────────
export const getVolunteerLeaderboard = () => API.get('/volunteers/leaderboard');
export const getAvailableDeliveries = () => API.get('/volunteers/available-deliveries');
export const claimDelivery = (id) => API.post(`/volunteers/claim/${id}`);
export const setAvailability = (isAvailable) => API.patch('/volunteers/availability', { isAvailable });

// ─── Fraud ────────────────────────────────────────────────────────────────────
export const getFraudAlerts = () => API.get('/fraud/alerts');
export const runFraudScan = () => API.post('/fraud/scan');
export const suspendUser = (userId) => API.patch(`/fraud/suspend/${userId}`);
export const clearFraudFlag = (deliveryId) => API.patch(`/fraud/clear/${deliveryId}`);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => API.get('/admin/dashboard');
export const getUsers = (params) => API.get('/admin/users', { params });
export const updateUserStatus = (id, status) => API.patch(`/admin/users/${id}/status`, { status });
export const reassignDelivery = (id, volunteerId) => API.patch(`/admin/deliveries/${id}/reassign`, { volunteerId });

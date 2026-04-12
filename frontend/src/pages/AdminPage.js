import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import {
  getAdminDashboard, getUsers, getFraudAlerts, runFraudScan,
  suspendUser, clearFraudFlag, updateUserStatus,
  getDonations, getRequests, getDeliveries,
} from '../services/api';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const runAIMatch = (donationId) => API.get(`/match/donation/${donationId}`);
const createDelivery = (donationId, requestId) => API.post('/deliveries', { donationId, requestId });
const getDemandAnalysis = () => API.get('/match/demand-analysis');

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [demandAnalysis, setDemandAnalysis] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [matchResult, setMatchResult] = useState(null);
  const [matchingId, setMatchingId] = useState(null);
  const [creatingDelivery, setCreatingDelivery] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchDashboard = useCallback(async () => {
    try { const { data } = await getAdminDashboard(); setStats(data.stats); } catch { }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'fraud') fetchFraud();
    if (tab === 'matching') { fetchDonations(); fetchRequests(); fetchDeliveries(); }
  }, [tab]);

  const fetchUsers = async () => { try { const { data } = await getUsers(); setUsers(data.users); } catch { } };
  const fetchFraud = async () => { try { const { data } = await getFraudAlerts(); setFraudAlerts(data.alerts); } catch { } };
  const fetchDonations = async () => { try { const { data } = await getDonations({ status: 'available' }); setDonations(data.donations); } catch { } };
  const fetchRequests = async () => { try { const { data } = await getRequests({ status: 'open' }); setRequests(data.requests); } catch { } };
  const fetchDeliveries = async () => { try { const { data } = await getDeliveries(); setDeliveries(data.deliveries); } catch { } };

  const handleRunMatch = async (donationId) => {
    setMatchingId(donationId);
    setMatchResult(null);
    try {
      const { data } = await runAIMatch(donationId);
      setMatchResult({ donationId, ...data.result });
      if (data.result.matched) {
        showMsg(`AI found a match! Score: ${(data.result.matchScore * 100).toFixed(0)}% · Distance: ${data.result.distanceKm}km`, 'success');
      } else {
        showMsg(data.result.message || 'No compatible request found yet.', 'warn');
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Matching failed. Make sure both donation and request exist.', 'error');
    } finally { setMatchingId(null); }
  };

  const handleCreateDelivery = async (donationId, requestId) => {
    setCreatingDelivery(true);
    try {
      const { data } = await createDelivery(donationId, requestId);
      showMsg(
        data.volunteerMatch?.found
          ? `Delivery created! Volunteer "${data.volunteerMatch.volunteer.name}" assigned automatically.`
          : 'Delivery created! Waiting for a volunteer to claim it.',
        'success'
      );
      setMatchResult(null);
      fetchDonations(); fetchRequests(); fetchDeliveries(); fetchDashboard();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to create delivery.', 'error');
    } finally { setCreatingDelivery(false); }
  };

  const handleLoadDemand = async () => {
    try {
      const { data } = await getDemandAnalysis();
      setDemandAnalysis(data.analysis.analysis);
    } catch { showMsg('Could not load demand analysis.', 'error'); }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data } = await runFraudScan();
      showMsg(`Scan complete. Checked ${data.result.scanned}, flagged ${data.result.flagged}.`, 'success');
      fetchFraud();
    } catch { showMsg('Scan failed.', 'error'); }
    finally { setScanning(false); }
  };

  const handleSuspend = async (userId) => {
    try { await suspendUser(userId); showMsg('User suspended.', 'success'); fetchFraud(); } catch { }
  };
  const handleClear = async (deliveryId) => {
    try { await clearFraudFlag(deliveryId); showMsg('Flag cleared.', 'success'); fetchFraud(); } catch { }
  };
  const handleStatusChange = async (userId, status) => {
    try { await updateUserStatus(userId, status); showMsg(`Status updated to ${status}`, 'success'); fetchUsers(); } catch { }
  };

  const ROLE_COLOR = { donor: '#185FA5', ngo: '#3B6D11', volunteer: '#BA7517', admin: '#993556' };
  const STATUS_COLOR = { active: '#3B6D11', suspended: '#A32D2D', pending: '#BA7517' };
  const URGENCY_BG = { low: '#f5f4f0', medium: '#FAEEDA', high: '#E6F1FB', critical: '#FCEBEB' };
  const URGENCY_COLOR = { low: '#888', medium: '#BA7517', high: '#185FA5', critical: '#A32D2D' };
  const CATEGORY_EMOJI = { food_cooked: '🍱', food_raw: '🌾', clothes: '👕', medicines: '💊', books: '📚', other: '📦' };

  const msgStyle = (type) => ({
    background: { success: '#f0fdf4', warn: '#fffbeb', error: '#fef2f2' }[type],
    border: `0.5px solid ${{ success: '#86efac', warn: '#fcd34d', error: '#fca5a5' }[type]}`,
    color: { success: '#166534', warn: '#92400e', error: '#b91c1c' }[type],
  });

  const card = { background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '0.875rem' };
  const TABS = ['dashboard', 'matching', 'users', 'fraud'];
  const TAB_LABELS = { dashboard: 'Dashboard', matching: 'AI Matching', users: 'Users', fraud: 'Fraud Monitor' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: '1.25rem' }}>Admin Panel</h1>

        {message.text && (
          <div style={{ ...msgStyle(message.type), borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'inherit', marginLeft: 12 }}>×</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 18px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
              background: tab === t ? '#993556' : '#fff',
              color: tab === t ? '#fff' : '#666',
              border: `0.5px solid ${tab === t ? '#993556' : '#d0cfc7'}`,
              fontWeight: tab === t ? 500 : 400,
            }}>
              {TAB_LABELS[t]}
              {t === 'matching' && <span style={{ marginLeft: 6, fontSize: 10, background: '#FAEEDA', color: '#BA7517', padding: '1px 6px', borderRadius: 8 }}>AI</span>}
              {t === 'fraud' && fraudAlerts.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: '#FCEBEB', color: '#A32D2D', padding: '1px 6px', borderRadius: 8 }}>{fraudAlerts.length}</span>}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD ─── */}
        {tab === 'dashboard' && stats && (
          <div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: '0.75rem', fontWeight: 500 }}>Users</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[{ label: 'Total', value: stats.users.total, color: '#993556' }, { label: 'Donors', value: stats.users.donors, color: '#185FA5' }, { label: 'NGOs', value: stats.users.ngos, color: '#3B6D11' }, { label: 'Volunteers', value: stats.users.volunteers, color: '#BA7517' }].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: '#888', marginBottom: '0.75rem', fontWeight: 500 }}>Resources & Deliveries</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { label: 'Available Donations', value: stats.donations.available, color: '#185FA5' },
                { label: 'Open Requests', value: stats.requests.open, color: '#BA7517' },
                { label: 'Total Deliveries', value: stats.deliveries.total, color: '#3B6D11' },
                { label: 'Success Rate', value: `${stats.successRate}%`, color: '#3B6D11' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ ...card, background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#0C447C', marginBottom: 6 }}>Next step: Run AI Matching</p>
              <p style={{ fontSize: 13, color: '#185FA5', marginBottom: 12 }}>
                You have <strong>{stats.donations.available}</strong> donations and <strong>{stats.requests.open}</strong> open NGO requests. Go to AI Matching to connect them.
              </p>
              <button onClick={() => setTab('matching')} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Go to AI Matching →
              </button>
            </div>
          </div>
        )}

        {/* ─── AI MATCHING ─── */}
        {tab === 'matching' && (
          <div>
            {/* How it works */}
            <div style={{ ...card, background: '#FAEEDA', border: '0.5px solid #FAC775' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#633806', marginBottom: 4 }}>How AI Matching works</p>
              <p style={{ fontSize: 13, color: '#854F0B' }}>
                1. Click <strong>"Run AI Match"</strong> on any donation below →
                2. AI finds the best NGO request using distance + urgency + category →
                3. Click <strong>"Confirm Match"</strong> to create the delivery and auto-assign a volunteer.
              </p>
            </div>

            {/* Demand Analysis */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: demandAnalysis ? 12 : 0 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>AI Demand Analysis</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>See which categories have the most need</p>
                </div>
                <button onClick={handleLoadDemand} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, background: '#f0efe8', color: '#555', border: '0.5px solid #d0cfc7', borderRadius: 8, cursor: 'pointer' }}>
                  Run Analysis
                </button>
              </div>
              {demandAnalysis && demandAnalysis.map(d => (
                <div key={d.category} style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #f0efe8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{d.category.replace('_', ' ')}</span>
                    <span style={{ color: d.gap > 0 ? '#A32D2D' : '#3B6D11', fontWeight: 500 }}>
                      {d.gap > 0 ? `${d.gap} more needed` : 'Supply sufficient'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: '#888' }}>
                    <span style={{ width: 8, height: 8, background: '#185FA5', borderRadius: 2, display: 'inline-block' }} /> Surplus: {d.surplusCount}
                    <span style={{ width: 8, height: 8, background: '#BA7517', borderRadius: 2, display: 'inline-block', marginLeft: 8 }} /> Demand: {d.demandCount}
                  </div>
                  <div style={{ height: 5, background: '#f0efe8', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(d.surplusCount * 15, 100)}%`, height: '100%', background: '#185FA5', borderRadius: 3 }} />
                  </div>
                  <div style={{ height: 5, background: '#f0efe8', borderRadius: 3, marginTop: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(d.demandCount * 15, 100)}%`, height: '100%', background: '#BA7517', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Match Result Banner */}
            {matchResult?.matched && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.875rem' }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#166534', marginBottom: 10 }}>AI Match Found!</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>Match Score</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#3B6D11', margin: 0 }}>{(matchResult.matchScore * 100).toFixed(0)}%</p>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>Distance</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#185FA5', margin: 0 }}>{matchResult.distanceKm} km</p>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>NGO</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a18', margin: 0 }}>{matchResult.request?.ngo?.ngoName || matchResult.request?.ngo?.name}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                  Request: <strong>{matchResult.request?.title}</strong> · Urgency: <span style={{ background: URGENCY_BG[matchResult.request?.urgency], color: URGENCY_COLOR[matchResult.request?.urgency], padding: '1px 8px', borderRadius: 10, fontSize: 12 }}>{matchResult.request?.urgency}</span> · For {matchResult.request?.beneficiariesCount} people
                </p>
                <button
                  onClick={() => handleCreateDelivery(matchResult.donationId, matchResult.request._id)}
                  disabled={creatingDelivery}
                  style={{ padding: '9px 22px', fontSize: 13, fontWeight: 500, background: creatingDelivery ? '#aaa' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, cursor: creatingDelivery ? 'not-allowed' : 'pointer' }}
                >
                  {creatingDelivery ? 'Creating delivery…' : '✓ Confirm Match & Assign Volunteer'}
                </button>
                <button onClick={() => setMatchResult(null)} style={{ marginLeft: 10, padding: '9px 16px', fontSize: 13, border: '0.5px solid #d0cfc7', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#666' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Available Donations */}
            <div style={card}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Available Donations <span style={{ fontSize: 13, color: '#185FA5', fontWeight: 400 }}>({donations.length})</span>
              </p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Click "Run AI Match" on a donation to find the best NGO request for it.</p>
              {donations.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '1.5rem 0' }}>No available donations. Ask a donor to upload one first.</p>
              ) : donations.map(d => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f0efe8' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {CATEGORY_EMOJI[d.category] || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{d.title}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{d.quantity} · by {d.donor?.name} · {d.pickupAddress}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#E6F1FB', color: '#185FA5', flexShrink: 0 }}>
                    {d.category?.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleRunMatch(d._id)}
                    disabled={matchingId === d._id}
                    style={{ padding: '7px 16px', fontSize: 12, fontWeight: 500, background: matchingId === d._id ? '#f0efe8' : '#185FA5', color: matchingId === d._id ? '#888' : '#fff', border: 'none', borderRadius: 8, cursor: matchingId === d._id ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                  >
                    {matchingId === d._id ? 'Matching…' : 'Run AI Match'}
                  </button>
                </div>
              ))}
            </div>

            {/* Open NGO Requests */}
            <div style={card}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Open NGO Requests <span style={{ fontSize: 13, color: '#BA7517', fontWeight: 400 }}>({requests.length})</span>
              </p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>These NGOs are waiting for resources.</p>
              {requests.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '1.5rem 0' }}>No open requests. Ask an NGO to submit one first.</p>
              ) : requests.map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f0efe8' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{r.title}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{r.quantityNeeded} · {r.beneficiariesCount} people · {r.ngo?.ngoName || r.ngo?.name}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: URGENCY_BG[r.urgency], color: URGENCY_COLOR[r.urgency], fontWeight: 500, flexShrink: 0 }}>{r.urgency}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0efe8', color: '#666', flexShrink: 0 }}>{r.category?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            {/* Active Deliveries */}
            <div style={card}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
                Active Deliveries <span style={{ fontSize: 13, color: '#3B6D11', fontWeight: 400 }}>({deliveries.length})</span>
              </p>
              {deliveries.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '1rem 0' }}>No deliveries yet. Match a donation above to create one.</p>
              ) : deliveries.map(d => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #f0efe8' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{d.donation?.title || 'Resource'}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
                      {d.donor?.name} → {d.ngo?.ngoName || d.ngo?.name} · Volunteer: <strong>{d.volunteer?.name || 'Unassigned'}</strong>
                    </p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#E6F1FB', color: '#185FA5', fontWeight: 500, flexShrink: 0 }}>
                    {d.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === 'users' && (
          <div style={card}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>{users.length} registered users</p>
            {users.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '1rem 0' }}>No users found.</p>
            ) : users.map((u, i) => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < users.length - 1 ? '0.5px solid #f0efe8' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${ROLE_COLOR[u.role]}20`, color: ROLE_COLOR[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{u.email}</p>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${ROLE_COLOR[u.role]}15`, color: ROLE_COLOR[u.role], flexShrink: 0 }}>{u.role}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLOR[u.status] || '#888'}15`, color: STATUS_COLOR[u.status] || '#888', flexShrink: 0 }}>{u.status}</span>
                {u.role !== 'admin' && (
                  <button onClick={() => handleStatusChange(u._id, u.status === 'active' ? 'suspended' : 'active')}
                    style={{ padding: '5px 10px', fontSize: 12, border: '0.5px solid #d0cfc7', borderRadius: 8, background: '#fff', cursor: 'pointer', color: u.status === 'active' ? '#A32D2D' : '#3B6D11', flexShrink: 0 }}>
                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── FRAUD ─── */}
        {tab === 'fraud' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{fraudAlerts.length} flagged deliveries</p>
              <button onClick={handleScan} disabled={scanning} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, background: scanning ? '#f5f4f0' : '#993556', color: scanning ? '#888' : '#fff', border: 'none', borderRadius: 8, cursor: scanning ? 'not-allowed' : 'pointer' }}>
                {scanning ? 'Scanning…' : 'Run AI Fraud Scan'}
              </button>
            </div>
            {fraudAlerts.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: '#888', fontSize: 14, padding: '2rem' }}>No fraud alerts. System is clean.</div>
            ) : fraudAlerts.map(alert => (
              <div key={alert._id} style={{ ...card, borderLeft: `4px solid ${alert.fraudScore >= 70 ? '#A32D2D' : '#BA7517'}`, borderRadius: 0, borderTopRightRadius: 14, borderBottomRightRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Volunteer: {alert.volunteer?.name || 'Unknown'}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: alert.fraudScore >= 70 ? '#FCEBEB' : '#FAEEDA', color: alert.fraudScore >= 70 ? '#A32D2D' : '#BA7517' }}>
                        Score: {alert.fraudScore}/100
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Donor: {alert.donor?.name} → NGO: {alert.ngo?.ngoName || alert.ngo?.name}</p>
                    {alert.fraudFlags?.map((f, i) => <p key={i} style={{ fontSize: 12, color: '#A32D2D', margin: '2px 0' }}>⚠ {f.description}</p>)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                    <button onClick={() => handleSuspend(alert.volunteer?._id)} style={{ padding: '5px 12px', fontSize: 12, border: 'none', borderRadius: 8, background: '#A32D2D', color: '#fff', cursor: 'pointer' }}>Suspend</button>
                    <button onClick={() => handleClear(alert._id)} style={{ padding: '5px 12px', fontSize: 12, border: '0.5px solid #d0cfc7', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#666' }}>Clear</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

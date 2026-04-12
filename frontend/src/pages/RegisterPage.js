import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const ROLES = [
  { value: 'donor', label: 'Donor', icon: '🤲', desc: 'Share food, clothes & essentials', color: '#2D6A4F' },
  { value: 'ngo',   label: 'NGO',   icon: '🏛️', desc: 'Represent an organisation', color: '#1B4332' },
  { value: 'volunteer', label: 'Volunteer', icon: '🚴', desc: 'Deliver resources to those in need', color: '#D4A853' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'donor', ngoName: '', city: '', address: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await register(form);
      navigate('/verify-otp', { state: { userId: data.userId, phone: form.phone } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    border: '1.5px solid #D4C9A8', borderRadius: 10, outline: 'none',
    background: '#fff', color: '#1C1C1A', transition: 'border .2s',
    boxSizing: 'border-box', marginBottom: '1rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520, animation: 'fadeUp .6s ease both' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#1B4332,#2D6A4F)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif" }}>ResourceAI</span>
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>Join the Network</h1>
          <p style={{ fontSize: 14, color: '#6B6560' }}>Create your account to start making an impact</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(27,67,50,0.1)', border: '1px solid #E8DDB5' }}>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#991B1B', marginBottom: '1.25rem' }}>
              ⚠ {error}
            </div>
          )}

          {/* Role selector */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>I am joining as</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
            {ROLES.map(r => (
              <div key={r.value} onClick={() => setForm({ ...form, role: r.value })} style={{
                padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${form.role === r.value ? r.color : '#E8DDB5'}`,
                background: form.role === r.value ? `${r.color}10` : '#FEFAE0',
                transition: 'all .2s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? r.color : '#3D3830', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: '#9A8F80', lineHeight: 1.3 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</label>
                <input style={inputStyle} placeholder="Arjun Kumar" value={form.name} onChange={set('name')} required
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</label>
                <input style={inputStyle} placeholder="+919876543210" value={form.phone} onChange={set('phone')} required
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
            <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={set('email')} required
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
            <input type="password" style={inputStyle} placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>City</label>
                <input style={inputStyle} placeholder="Lucknow" value={form.city} onChange={set('city')}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Area / Address</label>
                <input style={inputStyle} placeholder="Gomti Nagar" value={form.address} onChange={set('address')}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />
              </div>
            </div>

            {form.role === 'ngo' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>NGO Name</label>
                <input style={inputStyle} placeholder="CareNGO Foundation" value={form.ngoName} onChange={set('ngoName')} required
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#D4C9A8'} />
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
              background: loading ? '#74C69D' : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(27,67,50,0.25)', transition: 'all .2s',
            }}>
              {loading ? 'Creating account…' : 'Create Account & Get OTP →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: '#6B6560' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

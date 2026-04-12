import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OtpPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const userId = state?.userId;
  const phone = state?.phone;

  if (!userId) { navigate('/register'); return null; }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await verifyOtp({ userId, otp });
      loginUser(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ userId });
      setSuccess('New OTP sent to your phone!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp .6s ease both' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 40px rgba(27,67,50,0.1)', border: '1px solid #E8DDB5', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #EAF5EE, #C6E8D4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: 32 }}>
            📱
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>Verify Your Phone</h1>
          <p style={{ fontSize: 14, color: '#6B6560', marginBottom: '2rem', lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: '#1B4332' }}>{phone || 'your phone'}</strong>
          </p>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991B1B', marginBottom: '1rem' }}>⚠ {error}</div>}
          {success && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: '1rem' }}>✓ {success}</div>}

          <form onSubmit={handleVerify}>
            <input
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6} placeholder="——————" required
              style={{
                width: '100%', padding: '16px', fontSize: 28, textAlign: 'center',
                letterSpacing: '0.5em', fontWeight: 700, color: '#1B4332',
                border: '2px solid #D4C9A8', borderRadius: 14, outline: 'none',
                boxSizing: 'border-box', marginBottom: '1.25rem', background: '#FEFAE0',
                fontFamily: 'monospace', transition: 'border .2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'}
              onBlur={e => e.target.style.borderColor = '#D4C9A8'}
            />
            <button type="submit" disabled={loading || otp.length < 4}
              style={{
                width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
                background: loading ? '#74C69D' : 'linear-gradient(135deg,#1B4332,#2D6A4F)',
                color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(27,67,50,0.25)', transition: 'all .2s',
              }}>
              {loading ? 'Verifying…' : 'Verify & Continue →'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', fontSize: 13, color: '#9A8F80' }}>
            Didn't receive it?{' '}
            <button onClick={handleResend} style={{ background: 'none', border: 'none', color: '#2D6A4F', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Resend OTP
            </button>
          </p>

          <div style={{ marginTop: '1.5rem', padding: '12px', background: '#F8F3E3', borderRadius: 10, fontSize: 12, color: '#9A8F80' }}>
            In development mode, check your backend terminal console for the OTP.
          </div>
        </div>
      </div>
    </div>
  );
}

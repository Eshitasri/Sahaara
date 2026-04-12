import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1B4332,#2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🌿</div>
      <h1 style={{ fontSize: 80, fontWeight: 700, color: 'rgba(255,255,255,0.15)', fontFamily: "'Playfair Display',serif", lineHeight: 1, marginBottom: 8 }}>404</h1>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff', fontFamily: "'Playfair Display',serif", marginBottom: 12 }}>Page not found</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', maxWidth: 320 }}>The page you're looking for doesn't exist or has been moved.</p>
      <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 28px', background: '#D4A853', color: '#1B4332', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(212,168,83,0.4)' }}>
        Back to Home
      </button>
    </div>
  );
}

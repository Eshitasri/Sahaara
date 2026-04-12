import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// Curated Unsplash welfare images
const IMAGES = {
  donor:     'https://images.unsplash.com/photo-1593113630400-ea4288922559?w=600&q=80',
  ngo:       'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80',
  volunteer: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80',
  admin:     'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80',
};

const IMPACT_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&q=70', label: 'Community Meals' },
  { src: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&q=70', label: 'Clothing Drives' },
  { src: 'https://images.unsplash.com/photo-1550534791-2677533605ab?w=400&q=70', label: 'Volunteer Heroes' },
];

const ROLE_CONFIG = {
  donor: {
    color: '#2D6A4F', light: '#EAF5EE',
    greeting: 'Every meal shared is a life changed.',
    actions: [
      { label: 'Upload Donation', desc: 'Share food, clothes or medicines', path: '/donor', icon: '📦', color: '#1B4332' },
      { label: 'Track My Donations', desc: 'See delivery status in real-time', path: '/donor', icon: '🗺️', color: '#2D6A4F' },
    ],
    stats: [{ label: 'Items Donated', value: '—', icon: '📦' }, { label: 'Lives Impacted', value: '—', icon: '❤️' }, { label: 'Successful Deliveries', value: '—', icon: '✅' }],
  },
  ngo: {
    color: '#1B4332', light: '#E8F4EE',
    greeting: 'Your requests reach the right hands.',
    actions: [
      { label: 'Submit Resource Request', desc: 'Tell us what your community needs', path: '/ngo', icon: '📋', color: '#1B4332' },
      { label: 'Browse Donations', desc: 'See available resources near you', path: '/ngo', icon: '🔍', color: '#2D6A4F' },
    ],
    stats: [{ label: 'Open Requests', value: '—', icon: '📋' }, { label: 'Resources Received', value: '—', icon: '📦' }, { label: 'Beneficiaries Helped', value: '—', icon: '👥' }],
  },
  volunteer: {
    color: '#D4A853', light: '#FDF5E6',
    greeting: 'Your wheels bring hope to doorsteps.',
    actions: [
      { label: 'Find Deliveries', desc: 'Pick up assignments near you', path: '/volunteer', icon: '🔍', color: '#1B4332' },
      { label: 'My Assignments', desc: 'Manage your active deliveries', path: '/volunteer', icon: '🚴', color: '#D4A853' },
    ],
    stats: [{ label: 'Trust Score', value: '—', icon: '⭐' }, { label: 'Total Deliveries', value: '—', icon: '🚀' }, { label: 'Success Rate', value: '—', icon: '✅' }],
  },
  admin: {
    color: '#1B4332', light: '#E8F4EE',
    greeting: 'Orchestrating impact at scale.',
    actions: [
      { label: 'AI Matching Panel', desc: 'Connect donations with NGO requests', path: '/admin', icon: '🤖', color: '#1B4332' },
      { label: 'Fraud Monitor', desc: 'Review flagged deliveries', path: '/admin', icon: '🛡️', color: '#D4A853' },
    ],
    stats: [{ label: 'Total Users', value: '—', icon: '👥' }, { label: 'Active Deliveries', value: '—', icon: '🚚' }, { label: 'Fraud Alerts', value: '—', icon: '⚠️' }],
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.donor;
  const heroImg = IMAGES[user?.role] || IMAGES.donor;

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0' }}>
      <Navbar />

      {/* HERO BANNER */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cfg.color}CC, rgba(27,67,50,0.85))` }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ animation: 'fadeUp .7s ease both' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
              {user?.role?.toUpperCase()} DASHBOARD
            </span>
            <h1 style={{ fontSize: 38, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',serif", lineHeight: 1.2, marginBottom: 12, maxWidth: 600 }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', fontFamily: "'Playfair Display',serif" }}>
              "{cfg.greeting}"
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: '2rem', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
          {cfg.stats.map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{
              animationDelay: `${i * 0.1}s`,
              background: '#fff', borderRadius: 16, padding: '1.25rem 1.5rem',
              boxShadow: '0 8px 32px rgba(27,67,50,0.1)', border: '1px solid #F0EAD6',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: cfg.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: cfg.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9A8F80', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: '2rem' }}>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Quick Actions</h2>
            {cfg.actions.map((a, i) => (
              <div key={a.label} onClick={() => navigate(a.path)}
                className="animate-fadeUp"
                style={{
                  animationDelay: `${0.2 + i * 0.1}s`,
                  background: '#fff', borderRadius: 16, padding: '1.25rem',
                  marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                  border: '1px solid #F0EAD6', boxShadow: '0 2px 12px rgba(27,67,50,0.06)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(27,67,50,0.14)'; e.currentTarget.style.borderColor = cfg.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(27,67,50,0.06)'; e.currentTarget.style.borderColor = '#F0EAD6'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${a.color}12`, border: `1.5px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1A', marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontSize: 13, color: '#9A8F80' }}>{a.desc}</div>
                </div>
                <div style={{ color: cfg.color, fontSize: 18, opacity: 0.5 }}>→</div>
              </div>
            ))}
          </div>

          {/* Mission Panel */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Our Impact</h2>
            <div style={{ background: `linear-gradient(135deg, #1B4332, #2D6A4F)`, borderRadius: 16, padding: '1.5rem', color: '#fff', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
              {/* Decorative circle */}
              <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(116,198,157,0.15)' }} />
              <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,168,83,0.15)' }} />

              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>Together We Grow</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 16 }}>
                  Every donation matched through our AI connects surplus resources with communities that need them most — reducing waste and restoring dignity.
                </p>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[['2,400+', 'Donations'], ['180+', 'NGOs'], ['94%', 'Success']].map(([n, l]) => (
                    <div key={l}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#D4A853' }}>{n}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* How it works */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1px solid #F0EAD6' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>How it works</p>
              {[
                { step: '01', text: 'Donor uploads food or clothes', color: '#2D6A4F' },
                { step: '02', text: 'AI matches with nearest NGO need', color: '#40916C' },
                { step: '03', text: 'Volunteer delivers with GPS tracking', color: '#D4A853' },
              ].map((s, i) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${s.color}15`, color: s.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div style={{ fontSize: 13, color: '#4A4540' }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IMPACT GALLERY */}
        <div className="animate-fadeUp" style={{ animationDelay: '.4s' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Stories of Impact</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {IMPACT_IMAGES.map((img, i) => (
              <div key={img.label} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1.06)'; e.currentTarget.querySelector('.overlay').style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; e.currentTarget.querySelector('.overlay').style.opacity = '0'; }}
              >
                <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s ease', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(27,67,50,0.8), transparent)' }} />
                <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(27,67,50,0.3)', opacity: 0, transition: 'opacity .3s' }} />
                <div style={{ position: 'absolute', bottom: 14, left: 14, color: '#fff', fontSize: 13, fontWeight: 600 }}>{img.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="animate-fadeUp" style={{ animationDelay: '.5s', marginTop: '2rem', background: '#fff', borderRadius: 16, padding: '2rem', border: '1px solid #F0EAD6', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 40, color: '#D4A853', fontFamily: "'Playfair Display',serif", lineHeight: 1, flexShrink: 0 }}>"</div>
          <div>
            <p style={{ fontSize: 15, color: '#4A4540', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
              Sahaara changed how we operate. We no longer worry about food going to waste or NGOs going without — the AI matching is remarkably accurate and the volunteers are incredibly reliable.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1B4332,#40916C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>SK</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>Seema Kapoor</div>
                <div style={{ fontSize: 12, color: '#9A8F80' }}>Director, AnnadaanTrust NGO</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

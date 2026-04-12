import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getAvailableDeliveries, getDeliveries, claimDelivery, getVolunteerLeaderboard, setAvailability } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HERO = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900&q=80';

const STATUS_MAP = {
  pending_volunteer:   { label: 'Pending',        color: '#6B6560', bg: '#F5F4F0' },
  volunteer_notified:  { label: 'Notified',        color: '#92400E', bg: '#FFF3CD' },
  volunteer_accepted:  { label: 'Accepted',        color: '#1D4ED8', bg: '#EFF6FF' },
  pickup_otp_sent:     { label: 'OTP Sent',        color: '#92400E', bg: '#FFF3CD' },
  pickup_confirmed:    { label: 'Picked Up',       color: '#2D6A4F', bg: '#D8F3DC' },
  in_transit:          { label: 'In Transit 🚴',   color: '#1B4332', bg: '#D8F3DC' },
  delivered:           { label: 'Delivered ✓',     color: '#1B4332', bg: '#D8F3DC' },
  failed:              { label: 'Failed',           color: '#991B1B', bg: '#FEE2E2' },
};

const CAT_EMOJI = { food_cooked:'🍱', food_raw:'🌾', clothes:'👕', medicines:'💊', books:'📚', other:'📦' };

const MEDAL = ['🥇','🥈','🥉'];

export default function VolunteerPage() {
  const { user } = useAuth();
  const [tab, setTab]               = useState('available');
  const [available, setAvailable]   = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [isOnline, setIsOnline]     = useState(true);
  const [msg, setMsg]               = useState({ text:'', type:'' });
  const [claiming, setClaiming]     = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => { fetchAvailable(); fetchMyDeliveries(); fetchLeaderboard(); };

  const fetchAvailable    = async () => { try { const { data } = await getAvailableDeliveries(); setAvailable(data.deliveries || []); } catch {} };
  const fetchMyDeliveries = async () => { try { const { data } = await getDeliveries();            setMyDeliveries(data.deliveries || []); } catch {} };
  const fetchLeaderboard  = async () => { try { const { data } = await getVolunteerLeaderboard();  setLeaderboard(data.volunteers || []); } catch {} };

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 4000); };

  const handleClaim = async (id) => {
    setClaiming(id);
    try {
      await claimDelivery(id);
      showMsg('Delivery claimed! Check My Deliveries tab.', 'success');
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.message || 'Could not claim.', 'error'); }
    finally { setClaiming(null); }
  };

  const handleToggle = async () => {
    try { await setAvailability(!isOnline); setIsOnline(v => !v); showMsg(isOnline ? 'You are now Offline' : 'You are now Online 🟢', 'success'); }
    catch { showMsg('Could not update status.', 'error'); }
  };

  const myTrust = user?.trustScore || 0;
  const myRank  = leaderboard.findIndex(v => v._id === user?._id) + 1;

  const tabs = [
    { id:'available',   label:`Available (${available.length})` },
    { id:'mine',        label:`My Deliveries (${myDeliveries.length})` },
    { id:'leaderboard', label:'Leaderboard 🏆' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0' }}>
      <Navbar />

      {/* HERO */}
      <div style={{ position:'relative', height:260, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${HERO})`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.55)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(27,67,50,.85),rgba(212,168,83,.4))' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'0 1.5rem', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, display:'block' }}>Volunteer Portal</span>
          <h1 style={{ fontSize:34, fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:10 }}>
            Your wheels,<br/>someone's hope.
          </h1>
          {/* Online toggle in hero */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
            <div onClick={handleToggle} style={{ width:52, height:28, borderRadius:14, background:isOnline ? '#74C69D' : 'rgba(255,255,255,.3)', position:'relative', cursor:'pointer', transition:'background .3s', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
              <div style={{ width:22, height:22, background:'#fff', borderRadius:'50%', position:'absolute', top:3, left:isOnline ? 27 : 3, transition:'left .3s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:isOnline ? '#74C69D' : 'rgba(255,255,255,.6)' }}>{isOnline ? '🟢 Online — Ready for deliveries' : '⚫ Offline'}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 1.5rem' }}>

        {/* STAT CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:'-36px', marginBottom:'1.75rem', position:'relative', zIndex:10 }}>
          {[
            { icon:'⭐', label:'Trust Score',      value:`${myTrust}/10`,             color:'#D4A853' },
            { icon:'🚀', label:'My Deliveries',    value:user?.totalDeliveries || 0,  color:'#1B4332' },
            { icon:'✅', label:'Success Rate',      value:user?.totalDeliveries ? `${Math.round((user.successfulDeliveries/user.totalDeliveries)*100)}%` : '—', color:'#2D6A4F' },
            { icon:'🏅', label:'Leaderboard Rank', value:myRank ? `#${myRank}` : '—', color:'#D4A853' },
          ].map((s,i) => (
            <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'1rem', boxShadow:'0 8px 28px rgba(27,67,50,.1)', border:'1px solid #F0EAD6', textAlign:'center', animation:`fadeUp .5s ${i*.08}s ease both` }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#9A8F80', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trust score bar */}
        <div style={{ background:'#fff', borderRadius:16, padding:'1rem 1.25rem', marginBottom:'1.5rem', border:'1px solid #F0EAD6', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#1B4332' }}>Trust Score Progress</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#D4A853' }}>{myTrust} / 10</span>
            </div>
            <div style={{ height:8, background:'#F0EAD6', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${myTrust*10}%`, background:'linear-gradient(90deg,#74C69D,#D4A853)', borderRadius:4, transition:'width 1s ease' }} />
            </div>
            <p style={{ fontSize:11, color:'#9A8F80', marginTop:5 }}>Complete more deliveries on time to increase your score</p>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:'1.5rem' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'9px 20px', fontSize:13, fontWeight:500, borderRadius:10, cursor:'pointer',
              background:tab===t.id ? 'linear-gradient(135deg,#1B4332,#2D6A4F)' : '#fff',
              color:tab===t.id ? '#fff' : '#6B6560',
              border:tab===t.id ? 'none' : '1.5px solid #E8DDB5',
              boxShadow:tab===t.id ? '0 4px 14px rgba(27,67,50,.25)' : 'none',
              transition:'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* MESSAGE */}
        {msg.text && (
          <div style={{ background:msg.type==='success' ? '#D8F3DC' : '#FEE2E2', border:`1px solid ${msg.type==='success' ? '#74C69D' : '#FCA5A5'}`, borderRadius:12, padding:'12px 16px', fontSize:13, color:msg.type==='success' ? '#1B4332' : '#991B1B', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
            {msg.type==='success' ? '✅' : '⚠'} {msg.text}
          </div>
        )}

        {/* ── AVAILABLE DELIVERIES ── */}
        {tab==='available' && (
          <div style={{ marginBottom:'2rem' }}>
            {available.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'3rem', textAlign:'center', border:'1px solid #F0EAD6' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🎯</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:8 }}>No deliveries right now</h3>
                <p style={{ fontSize:14, color:'#9A8F80' }}>New assignments appear here when donors upload and admin matches them.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {available.map(d => (
                  <div key={d._id} style={{ background:'#fff', borderRadius:18, overflow:'hidden', border:'1px solid #F0EAD6', boxShadow:'0 2px 12px rgba(27,67,50,.06)', transition:'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 10px 30px rgba(27,67,50,.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(27,67,50,.06)'; e.currentTarget.style.transform=''; }}
                  >
                    {/* Card top accent */}
                    <div style={{ height:4, background:'linear-gradient(90deg,#1B4332,#D4A853)' }} />
                    <div style={{ padding:'1.25rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                          {CAT_EMOJI[d.donation?.category] || '📦'}
                        </div>
                        <div style={{ flex:1 }}>
                          <h4 style={{ fontSize:14, fontWeight:600, color:'#1C1C1A', margin:0, marginBottom:2 }}>{d.donation?.title || 'Donation'}</h4>
                          <p style={{ fontSize:12, color:'#9A8F80', margin:0 }}>{d.donation?.category?.replace('_',' ')} · {d.donation?.quantity}</p>
                        </div>
                      </div>

                      <div style={{ background:'#FEFAE0', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                        <div style={{ fontSize:12, color:'#6B6560', marginBottom:4 }}>
                          <span style={{ marginRight:12 }}>📍 Pickup: <strong style={{ color:'#1B4332' }}>{d.donation?.pickupAddress || 'See details'}</strong></span>
                        </div>
                        <div style={{ fontSize:12, color:'#6B6560' }}>
                          🏛️ NGO: <strong style={{ color:'#1B4332' }}>{d.ngo?.ngoName || d.ngo?.name || 'NGO'}</strong>
                        </div>
                      </div>

                      <button onClick={() => handleClaim(d._id)} disabled={claiming===d._id} style={{
                        width:'100%', padding:'10px', fontSize:13, fontWeight:600, borderRadius:10, border:'none',
                        background:claiming===d._id ? '#74C69D' : 'linear-gradient(135deg,#D4A853,#E8C07A)',
                        color:claiming===d._id ? '#fff' : '#1B4332',
                        cursor:claiming===d._id ? 'not-allowed' : 'pointer',
                        boxShadow:'0 3px 12px rgba(212,168,83,.3)', transition:'all .2s',
                      }}>
                        {claiming===d._id ? 'Claiming…' : '🚴 Claim Delivery'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY DELIVERIES ── */}
        {tab==='mine' && (
          <div style={{ marginBottom:'2rem' }}>
            {myDeliveries.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'3rem', textAlign:'center', border:'1px solid #F0EAD6' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:8 }}>No deliveries yet</h3>
                <p style={{ fontSize:14, color:'#9A8F80' }}>Claim an available delivery to get started!</p>
              </div>
            ) : myDeliveries.map(d => {
              const st = STATUS_MAP[d.status] || { label:d.status, color:'#888', bg:'#f5f4f0' };
              return (
                <div key={d._id} style={{ background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:12, border:'1px solid #F0EAD6', boxShadow:'0 2px 12px rgba(27,67,50,.06)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {CAT_EMOJI[d.donation?.category] || '📦'}
                  </div>
                  <div style={{ flex:1 }}>
                    <h4 style={{ fontSize:14, fontWeight:600, color:'#1C1C1A', margin:'0 0 3px' }}>{d.donation?.title || 'Delivery'}</h4>
                    <p style={{ fontSize:12, color:'#9A8F80', margin:'0 0 6px' }}>→ {d.ngo?.ngoName || d.ngo?.name}</p>
                    {/* Mini status timeline */}
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {['volunteer_accepted','pickup_confirmed','in_transit','delivered'].map((s,i) => {
                        const order = ['pending_volunteer','volunteer_notified','volunteer_accepted','pickup_otp_sent','pickup_confirmed','in_transit','delivered'];
                        const done = order.indexOf(d.status) >= order.indexOf(s);
                        return (
                          <React.Fragment key={s}>
                            <div style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:done?'#D8F3DC':'#F5F4F0', color:done?'#1B4332':'#B8B0A6', fontWeight:done?600:400 }}>
                              {['Accepted','Picked Up','Transit','Done'][i]}
                            </div>
                            {i<3 && <div style={{ flex:1, height:1, background:done?'#74C69D':'#E8DDB5', maxWidth:12 }} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab==='leaderboard' && (
          <div style={{ marginBottom:'2rem' }}>
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:12, marginBottom:20, alignItems:'end' }}>
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((v, i) => {
                  const rank = [2,1,3][i];
                  const heights = [140,170,120];
                  return (
                    <div key={v._id} style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', borderRadius:'16px 16px 0 0', height:heights[i], display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1rem', boxShadow:'0 8px 24px rgba(27,67,50,.2)' }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>{MEDAL[rank-1]}</div>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(212,168,83,.3)', border:'2px solid #D4A853', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#D4A853', marginBottom:6 }}>
                        {v.name.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#fff', textAlign:'center', marginBottom:2 }}>{v.name.split(' ')[0]}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#D4A853' }}>{v.trustScore}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.6)' }}>trust score</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #F0EAD6', overflow:'hidden' }}>
              {leaderboard.map((v, i) => {
                const isMe = v._id === user?._id;
                return (
                  <div key={v._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<leaderboard.length-1 ? '1px solid #F8F3E3' : 'none', background:isMe ? '#EAF5EE' : '#fff', transition:'background .15s' }}>
                    <div style={{ width:28, fontSize:14, textAlign:'center', fontWeight:700, color:i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'#9A8F80' }}>
                      {i<3 ? MEDAL[i] : `#${i+1}`}
                    </div>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:isMe?'linear-gradient(135deg,#1B4332,#2D6A4F)':'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:isMe?'#D4A853':'#2D6A4F', flexShrink:0 }}>
                      {v.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#1C1C1A', display:'flex', alignItems:'center', gap:6 }}>
                        {v.name} {isMe && <span style={{ fontSize:10, background:'#D4A853', color:'#1B4332', padding:'1px 6px', borderRadius:8, fontWeight:700 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize:12, color:'#9A8F80' }}>{v.successfulDeliveries}/{v.totalDeliveries} deliveries · {v.city || 'N/A'}</div>
                    </div>
                    {/* Mini bar */}
                    <div style={{ width:80 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:10, color:'#9A8F80' }}>Trust</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'#D4A853' }}>{v.trustScore}</span>
                      </div>
                      <div style={{ height:5, background:'#F0EAD6', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${v.trustScore*10}%`, background:'linear-gradient(90deg,#74C69D,#D4A853)', borderRadius:3 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

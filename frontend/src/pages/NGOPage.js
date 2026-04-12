import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createRequest, getRequests, getDeliveries, getDonations } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HERO = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900&q=80';

const URGENCY = {
  low:      { color:'#6B6560', bg:'#F5F4F0', border:'#D4C9A8' },
  medium:   { color:'#92400E', bg:'#FFF3CD', border:'#D4A853' },
  high:     { color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD' },
  critical: { color:'#991B1B', bg:'#FEE2E2', border:'#FCA5A5' },
};

const STATUS_REQ = {
  open:              { label:'Open',              bg:'#EFF6FF', color:'#1D4ED8' },
  partially_matched: { label:'Partly Matched',    bg:'#FFF3CD', color:'#92400E' },
  matched:           { label:'Matched ✓',         bg:'#D8F3DC', color:'#1B4332' },
  fulfilled:         { label:'Fulfilled 🎉',      bg:'#D8F3DC', color:'#1B4332' },
  cancelled:         { label:'Cancelled',         bg:'#FEE2E2', color:'#991B1B' },
};

const CAT_EMOJI = { food_cooked:'🍱', food_raw:'🌾', clothes:'👕', medicines:'💊', books:'📚', other:'📦' };
const CATS = ['food_cooked','food_raw','clothes','medicines','books','other'];

const inp = {
  width:'100%', padding:'12px 14px', fontSize:14,
  border:'1.5px solid #D4C9A8', borderRadius:10, outline:'none',
  background:'#fff', color:'#1C1C1A', boxSizing:'border-box',
  fontFamily:"'DM Sans',sans-serif", transition:'border .2s',
};

export default function NGOPage() {
  const { user } = useAuth();
  const [tab, setTab]             = useState('browse');
  const [requests, setRequests]   = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [donations, setDonations] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState({ text:'', type:'' });
  const [form, setForm]           = useState({
    category:'food_raw', title:'', description:'',
    quantityNeeded:'', beneficiariesCount:'', urgency:'medium', deliveryAddress:'',
  });

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, []);

  const fetchAll = () => { fetchRequests(); fetchDeliveries(); fetchDonations(); };
  const fetchRequests  = async () => { try { const { data } = await getRequests();                      setRequests(data.requests || []); } catch {} };
  const fetchDeliveries= async () => { try { const { data } = await getDeliveries();                    setDeliveries(data.deliveries || []); } catch {} };
  const fetchDonations = async () => { try { const { data } = await getDonations({ status:'available', limit:50 }); setDonations(data.donations || []); } catch {} };

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await createRequest({ ...form, latitude:'26.8700', longitude:'80.9200' });
      showMsg('Request submitted! Admin will run AI matching soon.', 'success');
      setForm({ category:'food_raw', title:'', description:'', quantityNeeded:'', beneficiariesCount:'', urgency:'medium', deliveryAddress:'' });
      fetchRequests(); setTab('requests');
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to submit.', 'error'); }
    finally { setLoading(false); }
  };

  const filtered = filterCat==='all' ? donations : donations.filter(d => d.category===filterCat);
  const openReqs = requests.filter(r => r.status==='open').length;
  const matched  = requests.filter(r => r.status==='matched' || r.status==='fulfilled').length;

  const tabs = [
    { id:'browse',     label:`Browse Donations (${donations.length})` },
    { id:'requests',   label:`My Requests (${requests.length})` },
    { id:'submit',     label:'+ New Request' },
    { id:'deliveries', label:`Incoming (${deliveries.length})` },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0' }}>
      <Navbar />

      {/* HERO */}
      <div style={{ position:'relative', height:260, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${HERO})`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.5)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(27,67,50,.9),rgba(45,106,79,.7))' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'0 1.5rem', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, display:'block' }}>NGO Portal</span>
          <h1 style={{ fontSize:34, fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:10 }}>
            Resources for your<br/>community, matched by AI.
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.75)' }}>Browse available donations → Submit request → Get matched automatically</p>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 1.5rem' }}>

        {/* STAT CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:'-36px', marginBottom:'1.75rem', position:'relative', zIndex:10 }}>
          {[
            { icon:'📦', label:'Available Donations', value:donations.length,  color:'#1B4332' },
            { icon:'📋', label:'Open Requests',       value:openReqs,          color:'#D4A853' },
            { icon:'✅', label:'Matched Requests',    value:matched,           color:'#2D6A4F' },
            { icon:'🚚', label:'Incoming Deliveries', value:deliveries.length, color:'#1B4332' },
          ].map((s,i) => (
            <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'1rem', boxShadow:'0 8px 28px rgba(27,67,50,.1)', border:'1px solid #F0EAD6', textAlign:'center', animation:`fadeUp .5s ${i*.08}s ease both` }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#9A8F80', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'9px 18px', fontSize:13, fontWeight:500, borderRadius:10, cursor:'pointer',
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
          <div style={{ background:msg.type==='success'?'#D8F3DC':'#FEE2E2', border:`1px solid ${msg.type==='success'?'#74C69D':'#FCA5A5'}`, borderRadius:12, padding:'12px 16px', fontSize:13, color:msg.type==='success'?'#1B4332':'#991B1B', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
            {msg.type==='success'?'✅':'⚠'} {msg.text}
          </div>
        )}

        {/* ── BROWSE DONATIONS ── */}
        {tab==='browse' && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', borderRadius:16, padding:'1.25rem 1.5rem', marginBottom:'1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:4 }}>How to get resources</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.75)', margin:0 }}>Browse donations below → Submit a request → Admin runs AI match → Volunteer delivers to you</p>
              </div>
              <button onClick={() => setTab('submit')} style={{ padding:'9px 18px', background:'#D4A853', color:'#1B4332', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, marginLeft:16 }}>
                Request Now →
              </button>
            </div>

            {/* Category filter pills */}
            <div style={{ display:'flex', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>
              {['all', ...CATS].map(c => (
                <button key={c} onClick={() => setFilterCat(c)} style={{
                  padding:'6px 14px', fontSize:12, fontWeight:500, borderRadius:20, cursor:'pointer', transition:'all .15s',
                  background:filterCat===c ? '#1B4332' : '#fff',
                  color:filterCat===c ? '#fff' : '#6B6560',
                  border:filterCat===c ? 'none' : '1px solid #E8DDB5',
                }}>
                  {c==='all' ? 'All' : `${CAT_EMOJI[c]} ${c.replace('_',' ')}`}
                </button>
              ))}
            </div>

            {filtered.length===0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'3rem', textAlign:'center', border:'1px solid #F0EAD6' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>📭</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:8 }}>No donations in this category</h3>
                <p style={{ fontSize:14, color:'#9A8F80', marginBottom:16 }}>Submit a request — we'll notify you when a match is found.</p>
                <button onClick={() => setTab('submit')} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>Submit Request →</button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {filtered.map(d => (
                  <div key={d._id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', border:'1px solid #F0EAD6', boxShadow:'0 2px 12px rgba(27,67,50,.06)', transition:'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 10px 28px rgba(27,67,50,.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(27,67,50,.06)'; e.currentTarget.style.transform=''; }}
                  >
                    <div style={{ height:3, background:'linear-gradient(90deg,#74C69D,#D4A853)' }} />
                    <div style={{ padding:'1.1rem 1.25rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                          {CAT_EMOJI[d.category]||'📦'}
                        </div>
                        <div style={{ flex:1 }}>
                          <h4 style={{ fontSize:14, fontWeight:600, color:'#1C1C1A', margin:'0 0 2px' }}>{d.title}</h4>
                          <p style={{ fontSize:12, color:'#9A8F80', margin:0 }}>{d.category?.replace('_',' ')}</p>
                        </div>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'#D8F3DC', color:'#1B4332', fontWeight:600 }}>Available</span>
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, background:'#F5F4F0', color:'#6B6560', padding:'3px 10px', borderRadius:8 }}>📦 {d.quantity}</span>
                        <span style={{ fontSize:11, background:'#F5F4F0', color:'#6B6560', padding:'3px 10px', borderRadius:8 }}>📍 {d.pickupAddress?.substring(0,20) || 'Available'}…</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY REQUESTS ── */}
        {tab==='requests' && (
          <div style={{ marginBottom:'2rem' }}>
            {requests.length===0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'3rem', textAlign:'center', border:'1px solid #F0EAD6' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:8 }}>No requests yet</h3>
                <button onClick={() => setTab('submit')} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>Submit First Request →</button>
              </div>
            ) : requests.map(r => {
              const urg = URGENCY[r.urgency] || URGENCY.medium;
              const st  = STATUS_REQ[r.status] || { label:r.status, bg:'#F5F4F0', color:'#6B6560' };
              return (
                <div key={r._id} style={{ background:'#fff', borderRadius:16, padding:'1.25rem 1.5rem', marginBottom:12, border:'1px solid #F0EAD6', boxShadow:'0 2px 12px rgba(27,67,50,.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                        {CAT_EMOJI[r.category]||'📦'}
                      </div>
                      <div>
                        <h4 style={{ fontSize:14, fontWeight:600, color:'#1C1C1A', margin:'0 0 3px' }}>{r.title}</h4>
                        <p style={{ fontSize:12, color:'#9A8F80', margin:0 }}>{r.quantityNeeded} · {r.beneficiariesCount} people</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:urg.bg, color:urg.color, border:`1px solid ${urg.border}`, fontWeight:600 }}>{r.urgency}</span>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span>
                    </div>
                  </div>
                  {r.status==='open' && (
                    <div style={{ background:'#FFF3CD', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400E', display:'flex', alignItems:'center', gap:6 }}>
                      ⏳ Waiting for admin to run AI matching…
                    </div>
                  )}
                  {(r.status==='matched'||r.status==='fulfilled') && (
                    <div style={{ background:'#D8F3DC', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1B4332', display:'flex', alignItems:'center', gap:6 }}>
                      🎉 Matched! Check Incoming Deliveries tab.
                    </div>
                  )}
                  <p style={{ fontSize:11, color:'#B8B0A6', marginTop:8, marginBottom:0 }}>{new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUBMIT REQUEST ── */}
        {tab==='submit' && (
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:20, marginBottom:'2rem' }}>
            <div style={{ background:'#fff', borderRadius:20, padding:'1.75rem', boxShadow:'0 4px 24px rgba(27,67,50,.08)', border:'1px solid #F0EAD6' }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:'1.25rem' }}>Submit Resource Request</h2>
              <form onSubmit={handleSubmit}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1B4332', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>What do you need?</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.25rem' }}>
                  {CATS.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, category:c })} style={{
                      padding:'10px 6px', borderRadius:10, cursor:'pointer', textAlign:'center',
                      border:`2px solid ${form.category===c ? '#1B4332' : '#E8DDB5'}`,
                      background:form.category===c ? '#EAF5EE' : '#FEFAE0', transition:'all .15s',
                    }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{CAT_EMOJI[c]}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:form.category===c ? '#1B4332' : '#9A8F80' }}>{c.replace('_',' ')}</div>
                    </div>
                  ))}
                </div>

                {[
                  { key:'title',            label:'Request Title',       ph:'e.g. Rice and Dal for 50 families' },
                  { key:'quantityNeeded',   label:'Quantity Needed',     ph:'e.g. 10kg, 50 portions, 3 bags' },
                  { key:'beneficiariesCount', label:'No. of Beneficiaries', ph:'e.g. 50', type:'number' },
                  { key:'deliveryAddress',  label:'Your NGO Address',    ph:'Full delivery address' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1B4332', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{f.label}</label>
                    <input type={f.type||'text'} style={inp} placeholder={f.ph} value={form[f.key]} required
                      onChange={e => setForm({ ...form, [f.key]:e.target.value })}
                      onFocus={e => e.target.style.borderColor='#2D6A4F'}
                      onBlur={e => e.target.style.borderColor='#D4C9A8'} />
                  </div>
                ))}

                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1B4332', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Urgency Level</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:'1.25rem' }}>
                  {['low','medium','high','critical'].map(u => {
                    const s = URGENCY[u];
                    return (
                      <div key={u} onClick={() => setForm({ ...form, urgency:u })} style={{
                        padding:'10px 6px', borderRadius:10, cursor:'pointer', textAlign:'center',
                        border:`2px solid ${form.urgency===u ? s.border : '#E8DDB5'}`,
                        background:form.urgency===u ? s.bg : '#FEFAE0', transition:'all .15s',
                      }}>
                        <div style={{ fontSize:11, fontWeight:700, color:form.urgency===u ? s.color : '#9A8F80', textTransform:'capitalize' }}>{u}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginBottom:'1.25rem' }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1B4332', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Additional Notes</label>
                  <textarea style={{ ...inp, height:70, resize:'vertical' }} placeholder="Any specific requirements…"
                    value={form.description} onChange={e => setForm({ ...form, description:e.target.value })}
                    onFocus={e => e.target.style.borderColor='#2D6A4F'}
                    onBlur={e => e.target.style.borderColor='#D4C9A8'} />
                </div>

                <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', fontSize:15, fontWeight:600, background:loading?'#74C69D':'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff', border:'none', borderRadius:12, cursor:loading?'not-allowed':'pointer', boxShadow:'0 4px 16px rgba(27,67,50,.28)', transition:'all .2s' }}>
                  {loading ? '⏳ Submitting…' : '📋 Submit Request'}
                </button>
              </form>
            </div>

            {/* Right info panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', borderRadius:20, padding:'1.5rem', color:'#fff' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
                <h3 style={{ fontSize:16, fontWeight:600, fontFamily:"'Playfair Display',serif", marginBottom:8 }}>AI Powered Matching</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.8)', lineHeight:1.6 }}>
                  Once you submit, our Claude AI analyzes your request against all available donations — considering urgency, distance, category, and beneficiary count to find the best match.
                </p>
              </div>
              <div style={{ background:'#fff', borderRadius:20, padding:'1.5rem', border:'1px solid #F0EAD6' }}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:12 }}>Urgency Guide</h3>
                {[
                  ['🔵 Low',      'Non-urgent, can wait 2-3 days'],
                  ['🟡 Medium',   'Needed within 24 hours'],
                  ['🔴 High',     'Needed today — priority match'],
                  ['🚨 Critical', 'Emergency — immediate response'],
                ].map(([u,d]) => (
                  <div key={u} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#1B4332', minWidth:80 }}>{u}</div>
                    <div style={{ fontSize:12, color:'#9A8F80' }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INCOMING DELIVERIES ── */}
        {tab==='deliveries' && (
          <div style={{ marginBottom:'2rem' }}>
            {deliveries.length===0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'3rem', textAlign:'center', border:'1px solid #F0EAD6' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🚚</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#1B4332', fontFamily:"'Playfair Display',serif", marginBottom:8 }}>No incoming deliveries</h3>
                <p style={{ fontSize:14, color:'#9A8F80' }}>Submit a request and once matched, your delivery will appear here with live tracking.</p>
              </div>
            ) : deliveries.map(d => (
              <div key={d._id} style={{ background:'#fff', borderRadius:18, padding:'1.5rem', marginBottom:14, border:'1px solid #F0EAD6', boxShadow:'0 4px 16px rgba(27,67,50,.08)' }}>
                {/* Delivery header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:46, height:46, borderRadius:14, background:'#EAF5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                      {CAT_EMOJI[d.donation?.category]||'📦'}
                    </div>
                    <div>
                      <h4 style={{ fontSize:15, fontWeight:600, color:'#1C1C1A', margin:'0 0 3px' }}>{d.donation?.title||'Resource Delivery'}</h4>
                      <p style={{ fontSize:12, color:'#9A8F80', margin:0 }}>From: <strong style={{ color:'#1B4332' }}>{d.donor?.name||'Donor'}</strong></p>
                    </div>
                  </div>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600 }}>
                    {d.status?.replace(/_/g,' ')}
                  </span>
                </div>

                {/* Volunteer info */}
                <div style={{ background:'#FEFAE0', borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:d.volunteer ? 'linear-gradient(135deg,#1B4332,#2D6A4F)' : '#F0EAD6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:d.volunteer?'#D4A853':'#9A8F80' }}>
                    {d.volunteer ? d.volunteer.name.slice(0,2).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1C1C1A' }}>
                      {d.volunteer ? `🚴 ${d.volunteer.name}` : '⏳ Volunteer being assigned…'}
                    </div>
                    {d.volunteer?.trustScore && (
                      <div style={{ fontSize:11, color:'#9A8F80' }}>Trust Score: <strong style={{ color:'#D4A853' }}>{d.volunteer.trustScore}/10</strong></div>
                    )}
                  </div>
                </div>

                {/* Status timeline */}
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:'#1B4332', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Delivery Progress</p>
                  <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                    {[
                      { key:'matched',         label:'Matched',   icon:'🤖' },
                      { key:'pickup_confirmed',label:'Picked Up', icon:'📦' },
                      { key:'in_transit',      label:'In Transit',icon:'🚴' },
                      { key:'delivered',       label:'Delivered', icon:'✅' },
                    ].map((s,i) => {
                      const order = ['pending_volunteer','volunteer_notified','volunteer_accepted','pickup_otp_sent','pickup_confirmed','in_transit','delivered'];
                      const done = order.indexOf(d.status) >= order.indexOf(s.key);
                      return (
                        <React.Fragment key={s.key}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                            <div style={{ width:36, height:36, borderRadius:'50%', background:done?'linear-gradient(135deg,#1B4332,#2D6A4F)':'#F5F4F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:4, border:done?'none':'2px solid #E8DDB5', transition:'all .3s' }}>
                              {s.icon}
                            </div>
                            <span style={{ fontSize:10, color:done?'#1B4332':'#B8B0A6', fontWeight:done?600:400, textAlign:'center' }}>{s.label}</span>
                          </div>
                          {i<3 && <div style={{ flex:1, height:2, background:done?'linear-gradient(90deg,#74C69D,#D4A853)':'#E8DDB5', marginBottom:18, maxWidth:40, transition:'background .3s' }} />}
                        </React.Fragment>
                      );
                    })}
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

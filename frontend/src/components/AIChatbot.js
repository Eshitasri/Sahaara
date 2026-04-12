import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sendChat = (message, history) => API.post('/ai/chat', { message, conversationHistory: history });
const getSuggestions = () => API.get('/ai/donation-suggestions');

export default function AIChatbot({ userRole }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Namaste! Main ResourceAI ka AI assistant hoon. ${userRole === 'donor' ? 'Donation ke baare mein kuch poochna hai?' : userRole === 'ngo' ? 'Resource request ya delivery ke baare mein help chahiye?' : 'Delivery ya platform ke baare mein kuch poochna hai?'} 😊` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const { data } = await sendChat(userMsg, history);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maafi chahta hoon, abhi thodi problem aa rahi hai. Thodi der baad try karein.' }]);
    } finally { setLoading(false); }
  };

  const handleGetSuggestions = async () => {
    setShowSuggestions(true);
    try {
      const { data } = await getSuggestions();
      setSuggestions(data.suggestions);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Abhi ${data.suggestions?.topSuggestion || 'food items'} ki sabse zyada zarurat hai! ${data.suggestions?.motivationalMessage || ''}`
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Suggestions abhi load nahi ho sake. Please thodi der mein try karein.' }]);
    }
  };

  const quickQuestions = {
    donor: ['Kya donate karoon?', 'Donation kaise upload karein?', 'Delivery track kaise karein?'],
    ngo: ['Request kaise submit karein?', 'Match kab hoga?', 'Volunteer kab aayega?'],
    volunteer: ['Delivery kaise claim karein?', 'Trust score kaise badhega?', 'OTP verify kaise karein?'],
    admin: ['AI matching kaise kaam karta hai?', 'Fraud kaise detect hota hai?', 'Demand prediction kya hai?'],
  };

  const questions = quickQuestions[userRole] || quickQuestions.donor;

  return (
    <>
      {/* Floating Button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%',
          background: open ? '#1B4332' : 'linear-gradient(135deg, #2D6A4F, #1B4332)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 8px 32px rgba(27,67,50,0.4)',
          transition: 'all .3s ease',
          transform: open ? 'rotate(45deg) scale(0.9)' : 'scale(1)',
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>{open ? '✕' : '🤖'}</span>
      </div>

      {/* Notification dot */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: 78, right: 28, zIndex: 1001,
          background: '#D4A853', color: '#1B4332', fontSize: 10, fontWeight: 700,
          padding: '2px 6px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          AI
        </div>
      )}

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, zIndex: 1000,
          width: 360, height: 520, background: '#fff',
          borderRadius: 20, boxShadow: '0 20px 60px rgba(27,67,50,0.25)',
          border: '1px solid #E8DDB5', display: 'flex', flexDirection: 'column',
          animation: 'fadeUp .3s ease both',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(116,198,157,0.2)', border: '2px solid rgba(116,198,157,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>ResourceAI Assistant</div>
              <div style={{ fontSize: 11, color: 'rgba(116,198,157,0.9)' }}>Claude AI se powered • Online</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#74C69D', animation: 'pulse-dot 2s infinite' }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FEFAE0' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, marginTop: 2 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '10px 13px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1C1C1A',
                  fontSize: 13, lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(27,67,50,0.1)',
                  border: msg.role === 'assistant' ? '1px solid #E8DDB5' : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🤖</div>
                <div style={{ background: '#fff', border: '1px solid #E8DDB5', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#74C69D', animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          <div style={{ padding: '8px 14px', background: '#f8f3e3', borderTop: '1px solid #E8DDB5' }}>
            <div style={{ fontSize: 11, color: '#9A8F80', marginBottom: 6, fontWeight: 500 }}>QUICK QUESTIONS</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {questions.map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid #D4C9A8', background: '#fff', cursor: 'pointer', color: '#2D6A4F', fontWeight: 500, transition: 'all .15s' }}
                  onMouseEnter={e => { e.target.style.background = '#EAF5EE'; e.target.style.borderColor = '#2D6A4F'; }}
                  onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#D4C9A8'; }}
                >
                  {q}
                </button>
              ))}
              {userRole === 'donor' && (
                <button onClick={handleGetSuggestions}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid #D4A853', background: '#FFF3CD', cursor: 'pointer', color: '#856404', fontWeight: 500 }}>
                  💡 AI Suggestions
                </button>
              )}
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #E8DDB5', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Kuch poochna hai..."
              style={{
                flex: 1, padding: '9px 12px', fontSize: 13,
                border: '1.5px solid #E8DDB5', borderRadius: 12, outline: 'none',
                background: '#FEFAE0', color: '#1C1C1A', transition: 'border .2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'}
              onBlur={e => e.target.style.borderColor = '#E8DDB5'}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: input.trim() ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : '#E8DDB5',
                color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'all .2s', flexShrink: 0,
              }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

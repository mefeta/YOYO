import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { useAppStore } from '../store/appStore';

const DEMO_ACCOUNTS = [
  { email: 'admin@yoyo.ai', role: 'Admin' },
  { email: 'manager@yoyo.ai', role: 'Manager' },
  { email: 'agent@yoyo.ai', role: 'Agent' },
  { email: 'analyst@yoyo.ai', role: 'Analyst' },
  { email: 'viewer@yoyo.ai', role: 'Viewer' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      login(res.user, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Editorial brand panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', borderRight: '1px solid #d0d0ce', background: '#fff' }}>
        <div className="mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', marginBottom: 16, border: '1px solid #d0d0ce', display: 'inline-block', padding: '3px 10px', alignSelf: 'flex-start' }}>
          Now Available
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16 }}>
          Operational<br />intelligence.
        </h1>
        <div style={{ width: 40, height: 3, background: '#1a1a1a', marginBottom: 20 }} />
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', maxWidth: 400, marginBottom: 32 }}>
          YOYO analyzes incoming service requests, predicts SLA risk, and routes work to the best available agent using explainable AI scoring.
        </p>
        <div className="mono" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' }}>
          AI Model Online
        </div>
      </div>

      {/* Right — Login panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 48px', background: '#f8f8f6' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <div className="nav-logo" style={{ marginBottom: 24 }}>
              <span className="mark">Y</span>
              <span style={{ fontSize: 20 }}>YOYO</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Sign in</h2>
            <p style={{ fontSize: 12, color: '#666' }}>Enter your credentials to access the command center.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="frm-group">
              <label className="frm-label">Email</label>
              <input type="email" className="frm-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yoyo.ai" required />
            </div>
            <div className="frm-group">
              <label className="frm-label">Password</label>
              <input type="password" className="frm-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
            </div>

            {error && (
              <div style={{ fontSize: 11, color: '#c43a31', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace', border: '1px solid #c43a31', padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ justifyContent: 'center', marginBottom: 32 }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #e5e5e3', paddingTop: 20 }}>
            <div className="mono" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>Demo Access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword(a.role.toLowerCase()); }}
                  style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid #d0d0ce', background: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#666', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#1a1a1a'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0ce'; e.currentTarget.style.color = '#666'; }}
                >
                  {a.email} <span style={{ color: '#b0b0b0' }}>/ {a.role.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mono" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b0b0b0', textAlign: 'center', marginTop: 32 }}>
            YOYO v1.0 — Next Generation Operational Management Automation
          </div>
        </div>
      </div>
    </div>
  );
}

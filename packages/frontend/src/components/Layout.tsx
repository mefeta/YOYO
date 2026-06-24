import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Command', roles: ['admin', 'manager', 'agent', 'worker', 'analyst', 'viewer'] },
  { path: '/requests', label: 'Requests', roles: ['admin', 'manager', 'agent', 'worker', 'analyst', 'viewer'] },
  { path: '/ai-assignment', label: 'AI Routing', roles: ['admin', 'manager', 'agent'] },
  { path: '/agents', label: 'Agents', roles: ['admin', 'manager', 'agent'] },
  { path: '/teams', label: 'Teams', roles: ['admin', 'manager', 'agent'] },
  { path: '/analytics', label: 'Analytics', roles: ['admin', 'manager', 'analyst'] },
  { path: '/reports', label: 'Reports', roles: ['admin', 'manager'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout: storeLogout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'worker';
  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  // Admin gets an extra nav item
  if (role === 'admin') {
    visibleNavItems.push({ path: '/admin', label: 'Admin Panel', roles: ['admin'] });
  }

  const handleLogout = () => {
    storeLogout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className={mobileOpen ? 'mobile-nav-open' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ===== TOP NAV BAR ===== */}
      <nav className="nav-bar">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <span className="mark">Y</span>
            YOYO
          </Link>
          <div className="nav-links">
            {visibleNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button className="nav-mobile-btn" onClick={() => setMobileOpen(true)}>
            MENU
          </button>
        </div>

        <div className="nav-right">
          <span className="nav-user">{user?.name || 'User'} / {user?.role || ''}</span>
          <button onClick={handleLogout} className="btn btn-sm btn-secondary">
            Sign out
          </button>
        </div>
      </nav>

      {/* ===== MOBILE NAV OVERLAY ===== */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span className="nav-logo"><span className="mark">Y</span> YOYO</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setMobileOpen(false)}>
              Close
            </button>
          </div>
          {visibleNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link"
              style={{ fontSize: 12, padding: '12px 0' }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #d0d0ce', paddingTop: 16 }}>
            <div className="nav-user" style={{ marginBottom: 8 }}>{user?.name} / {user?.role}</div>
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="page-wrap">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Layout component
 * 
 * Provides consistent layout with navigation for all pages
 */

import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  return (
    <div className="layout">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>All-in-One</h2>
        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                🏠 Dashboard
              </Link>
            </li>
            <li>
              <Link to="/calendar" className={location.pathname === '/calendar' ? 'active' : ''}>
                📅 Calendar
              </Link>
            </li>
            <li>
              <Link to="/contacts" className={location.pathname === '/contacts' ? 'active' : ''}>
                👤 Contacts
              </Link>
            </li>
            <li>
              <Link to="/mail" className={location.pathname === '/mail' ? 'active' : ''}>
                ✉️ Mail
              </Link>
            </li>
            <li>
              <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
                ⚙️ Settings
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <div className="bottom-nav-icon">🏠</div>
          <span>Home</span>
        </Link>
        <Link to="/calendar" className={location.pathname === '/calendar' ? 'active' : ''}>
          <div className="bottom-nav-icon">📅</div>
          <span>Calendar</span>
        </Link>
        <Link to="/contacts" className={location.pathname === '/contacts' ? 'active' : ''}>
          <div className="bottom-nav-icon">👤</div>
          <span>Contacts</span>
        </Link>
        <Link to="/mail" className={location.pathname === '/mail' ? 'active' : ''}>
          <div className="bottom-nav-icon">✉️</div>
          <span>Mail</span>
        </Link>
        <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
          <div className="bottom-nav-icon">⚙️</div>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default Layout;

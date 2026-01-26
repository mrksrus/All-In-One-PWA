/**
 * Dashboard component
 * 
 * Main dashboard with links to all modules
 */

import { Link } from 'react-router-dom';
import Layout from './Layout';
import './Dashboard.css';

function Dashboard() {
  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Welcome to your personal data platform</p>
        
        <div className="dashboard-grid">
          <Link to="/calendar" className="dashboard-card">
            <div className="dashboard-card-icon">📅</div>
            <h3>Calendar</h3>
            <p>Manage your events and reminders</p>
          </Link>
          
          <Link to="/contacts" className="dashboard-card">
            <div className="dashboard-card-icon">👤</div>
            <h3>Contacts</h3>
            <p>Store and manage your contacts</p>
          </Link>
          
          <Link to="/mail" className="dashboard-card">
            <div className="dashboard-card-icon">✉️</div>
            <h3>Mail</h3>
            <p>Check and send emails</p>
          </Link>
          
          <Link to="/settings" className="dashboard-card">
            <div className="dashboard-card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure your account</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;

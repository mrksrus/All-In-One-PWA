/**
 * Settings component
 * 
 * User settings and configuration
 */

import Layout from './Layout';

function Settings() {
  return (
    <Layout>
      <div className="container">
        <h1>Settings</h1>
        <div className="card">
          <h2>Account Settings</h2>
          <p>Account settings will be available here.</p>
        </div>
        <div className="card">
          <h2>Email Configuration</h2>
          <p>Email settings are configured in the Mail module.</p>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;

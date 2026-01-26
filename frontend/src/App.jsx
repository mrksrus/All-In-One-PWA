/**
 * Main App component
 * 
 * This is the app shell - the main container for all modules.
 * Handles routing and navigation.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAccessToken, authAPI } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Calendar from './modules/calendar/Calendar';
import Contacts from './modules/contacts/Contacts';
import Mail from './modules/mail/Mail';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check setup status and authentication
    const checkSetup = async () => {
      try {
        const status = await authAPI.getSetupStatus();
        setNeedsSetup(status.needsSetup);
        
        // Check if user is authenticated
        const token = getAccessToken();
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSetup();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" /> : 
            needsSetup ? <Navigate to="/register" /> :
            <Login onLogin={() => setIsAuthenticated(true)} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/" /> : <Register />
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/calendar" 
          element={
            isAuthenticated ? <Calendar /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/contacts" 
          element={
            isAuthenticated ? <Contacts /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/mail" 
          element={
            isAuthenticated ? <Mail /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? <Settings /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

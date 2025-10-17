import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastProvider'; // Import ToastProvider
import './components/ToastNotification.css'; // Import toast CSS

import Home from './components/Home';
import TeamRegistration from './components/TeamRegistration';
import TeamList from './components/TeamList';
import TeamDetails from './components/TeamDetails';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <ToastProvider> {/* Add ToastProvider here */}
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<TeamRegistration />} />
                <Route path="/teams" element={<TeamList />} />
                <Route path="/teams/:id" element={<TeamDetails />} />
              </Route>
            </Route>

          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Home from './components/Home';
import TeamRegistration from './components/TeamRegistration';
import TeamList from './components/TeamList';
import TeamDetails from './components/TeamDetails';
import EditTeam from './components/EditTeam'; // Import EditTeam
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import UserManagement from './components/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/register-team" element={<TeamRegistration />} />
              <Route path="/teams" element={<TeamList />} />
              <Route path="/teams/:id" element={<TeamDetails />} />
              <Route path="/teams/:id/edit" element={<EditTeam />} /> {/* Add this route */}
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
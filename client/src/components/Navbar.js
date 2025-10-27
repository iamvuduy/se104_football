import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink className="navbar-brand" to="/">Tournament</NavLink>
      </div>
      <div className="navbar-center">
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink className="nav-link" to="/register-team">Register Team</NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/teams">Team List</NavLink>
          </li>
          {user && user.role === 'admin' && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/users">User Management</NavLink>
            </li>
          )}
          {user && user.role === 'admin' && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/schedules">Schedule</NavLink>
            </li>
          )}
        </ul>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <span className="welcome-text">Welcome, {user.username}</span>
            <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink className="btn btn-login" to="/login">Login</NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: 'var(--facebook-blue)' }}>
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/">Giải đấu</NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Trang chủ</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/register">Tiếp nhận hồ sơ</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/teams">Danh sách đội</NavLink>
            </li>
          </ul>
          {user && (
            <div className="d-flex align-items-center">
              <span className="navbar-text me-3">
                Welcome, {user.username}
              </span>
              <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

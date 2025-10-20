import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { FaHome, FaUserPlus, FaListAlt, FaUsersCog, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top navbar-custom">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/"><FaTrophy /> Giải đấu</NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/"><FaHome /> Trang chủ</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/register-team"><FaUserPlus /> Tiếp nhận hồ sơ</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/teams"><FaListAlt /> Danh sách đội</NavLink>
            </li>
            {user && user.role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin/users"><FaUsersCog /> Quản lý tài khoản</NavLink>
              </li>
            )}
            {user && user.role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin/schedules"><FaCalendarAlt /> Lập lịch thi đấu</NavLink>
              </li>
            )}
          </ul>
          {user && (
            <div className="d-flex align-items-center">
              <span className="navbar-text me-3 welcome-text">
                Welcome, {user.username}
              </span>
              <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

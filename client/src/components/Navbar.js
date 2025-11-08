import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink className="navbar-brand" to="/">
          TRANG CHỦ
        </NavLink>
      </div>
      <div className="navbar-center">
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink className="nav-link" to="/register-team">
              Đăng ký đội
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/teams">
              Danh sách đội
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/player-lookup">
              Tra cứu cầu thủ
            </NavLink>
          </li>
          <li className="nav-item dropdown" ref={dropdownRef}>
            <span
              className="nav-link"
              onClick={toggleDropdown}
              style={{ cursor: "pointer" }}
            >
              BXH
            </span>
            <div className={`dropdown-content ${isDropdownOpen ? "show" : ""}`}>
              <NavLink
                className="nav-link"
                to="/team-leaderboard"
                onClick={() => setIsDropdownOpen(false)}
              >
                BXH Đội
              </NavLink>
              <NavLink
                className="nav-link"
                to="/top-scorer-leaderboard"
                onClick={() => setIsDropdownOpen(false)}
              >
                Vua phá lưới
              </NavLink>
            </div>
          </li>
          {user && user.role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/users">
                Quản lý người dùng
              </NavLink>
            </li>
          )}
          {user && user.role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/schedules">
                Lịch thi đấu
              </NavLink>
            </li>
          )}
          {user && user.role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/group-management">
                Bảng đấu
              </NavLink>
            </li>
          )}
          {user && user.role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/tournament-settings">
                Cài đặt giải đấu
              </NavLink>
            </li>
          )}
          {user && user.role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/record-result">
                Ghi kết quả
              </NavLink>
            </li>
          )}
        </ul>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <span className="welcome-text">Welcome, {user.username}</span>
            <button className="btn btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink className="btn btn-login" to="/login">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

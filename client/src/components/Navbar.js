import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolveRole, ROLES } from "../utils/roles";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, canAccessFeature } = useAuth();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Check if user is system_admin (only has manage_users permission)
  const isAdminOnly = user && resolveRole(user.role) === ROLES.SYSTEM_ADMIN;

  const navItems = [
    {
      key: "register-team",
      label: "Đăng ký đội",
      to: "/register-team",
      feature: "register_team",
    },
    {
      key: "teams",
      label: "Danh sách đội",
      to: "/teams",
      feature: "view_teams",
    },
    {
      key: "schedules",
      label: "Lịch thi đấu",
      to: "/admin/schedules",
      feature: "manage_schedules",
    },
    {
      key: "record-result",
      label: "Ghi kết quả",
      to: "/record-result",
      feature: "record_match_results",
    },
    {
      key: "player-lookup",
      label: "Tra cứu cầu thủ",
      to: "/player-lookup",
      feature: "view_players",
    },
    {
      key: "leaderboard",
      label: "Bảng xếp hạng",
      type: "dropdown",
      feature: "view_leaderboards",
      children: [
        {
          key: "team-leaderboard",
          label: "Bảng xếp hạng đội",
          to: "/team-leaderboard",
          feature: "view_leaderboards",
        },
        {
          key: "scorer-leaderboard",
          label: "Bảng xếp hạng ghi bàn",
          to: "/top-scorer-leaderboard",
          feature: "view_leaderboards",
        },
      ],
    },
    {
      key: "settings",
      label: "Cài đặt giải đấu",
      to: "/admin/tournament-settings",
      feature: "manage_settings",
    },
    {
      key: "users",
      label: "Quản lý người dùng",
      to: "/admin/users",
      feature: "manage_users",
    },
  ];

  const visibleNavItems = isAdminOnly
    ? navItems.filter((item) => item.key === "users") // Admin chỉ thấy "Quản lý người dùng"
    : navItems
        .map((item) => {
          if (item.type === "dropdown") {
            const visibleChildren = (item.children || []).filter((child) =>
              canAccessFeature(child.feature)
            );
            if (
              !canAccessFeature(item.feature) ||
              visibleChildren.length === 0
            ) {
              return null;
            }
            return { ...item, children: visibleChildren };
          }
          return canAccessFeature(item.feature) ? item : null;
        })
        .filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
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
          Trang chủ
        </NavLink>
      </div>
      <div className="navbar-center">
        <ul className="navbar-nav">
          {visibleNavItems.map((item) => {
            if (item.type === "dropdown") {
              const isOpen = openDropdown === item.key;
              return (
                <li
                  key={item.key}
                  className="nav-item dropdown"
                  ref={dropdownRef}
                >
                  <span
                    className="nav-link"
                    onClick={() => toggleDropdown(item.key)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.label}{" "}
                    <span style={{ fontSize: "0.7em", marginLeft: "4px" }}>
                      ▼
                    </span>
                  </span>
                  <div className={`dropdown-content ${isOpen ? "show" : ""}`}>
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.key}
                        className="nav-link"
                        to={child.to}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </li>
              );
            }

            return (
              <li key={item.key} className="nav-item">
                <NavLink className="nav-link" to={item.to}>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <span className="welcome-text">Xin chào, {user.username}</span>
            <button className="btn btn-logout" onClick={handleLogout}>
              ĐĂNG XUẤT
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

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";
import { FaUser, FaLock } from 'react-icons/fa';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    const result = await login(username, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-card">
        <h3>Đăng nhập</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
            />
            <label>Tên đăng nhập</label>
          </div>
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
            />
            <label>Mật khẩu</label>
          </div>
          <button type="submit" className="auth-button">
            Đăng nhập
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <p className="switch-form-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký tại đây</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

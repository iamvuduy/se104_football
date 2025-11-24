import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const payload = {
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      dob,
      position: position.trim(),
      password,
    };

    const result = await register(payload);
    if (!result.success) {
      setError(result.message || "Không thể tạo tài khoản. Vui lòng thử lại.");
      return;
    }

    const loginResult = await login(username, password);
    if (!loginResult.success) {
      setError(
        `Tạo tài khoản thành công, nhưng đăng nhập không thành công. ${
          loginResult.message || ""
        }`
      );
      return;
    }

    navigate("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-split-layout">
        <div className="auth-branding"></div>
        <div className="auth-form-container">
          <div className="auth-branding-content">
            <h1>Tạo tài khoản</h1>
            <p>Vui lòng điền đầy đủ thông tin để kích hoạt quyền truy cập.</p>
          </div>
          <div className="auth-form-card">
            <h2>Đăng ký</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  placeholder=" "
                  autoComplete="username"
                />
                <label htmlFor="username">Tên tài khoản</label>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder=" "
                  autoComplete="name"
                />
                <label htmlFor="fullName">Họ và tên</label>
              </div>

              <div className="input-group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder=" "
                  autoComplete="email"
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="input-group">
                <input
                  type="date"
                  id="dob"
                  value={dob}
                  onChange={(event) => setDob(event.target.value)}
                  required
                  placeholder=" "
                />
                <label htmlFor="dob">Ngày sinh</label>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  required
                  placeholder=" "
                />
                <label htmlFor="position">Chức vụ</label>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder=" "
                  autoComplete="new-password"
                />
                <label htmlFor="password">Mật khẩu</label>
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </span>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder=" "
                  autoComplete="new-password"
                />
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="auth-button">
                Đăng ký
              </button>
            </form>
            <div className="switch-form-text">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

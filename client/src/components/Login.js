import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginModern.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggleActive, setIsToggleActive] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerDob, setRegisterDob] = useState("");
  const [registerPosition, setRegisterPosition] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerNotice, setRegisterNotice] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => {
      document.body.classList.remove("auth-page");
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setLoginError("");
    setIsSubmitting(true);
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setLoginError(result.message || "Đăng nhập không thành công.");
    }
    setIsSubmitting(false);
  };

  const handleToggle = (nextActive) => {
    setIsToggleActive(nextActive);
    setLoginError("");
    setRegisterError("");
    setRegisterNotice("");
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (isRegistering) {
      return;
    }
    setRegisterError("");
    setRegisterNotice("");

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const positionValue = registerPosition.trim();
    const payload = {
      username: registerUsername.trim(),
      fullName: registerFullName.trim(),
      email: registerEmail.trim(),
      dob: registerDob,
      position: positionValue,
      password: registerPassword,
    };

    setIsRegistering(true);
    const result = await register(payload);
    if (!result.success) {
      setRegisterError(
        result.message || "Không thể tạo tài khoản. Vui lòng thử lại."
      );
      setIsRegistering(false);
      return;
    }

    const loginResult = await login(payload.username, payload.password);
    if (!loginResult.success) {
      setRegisterNotice(
        `Đăng ký thành công. Vui lòng đăng nhập thủ công. ${
          loginResult.message || ""
        }`
      );
      setIsRegistering(false);
      return;
    }

    setRegisterNotice("Đăng ký thành công! Đang chuyển đến hệ thống...");
    setIsRegistering(false);
    navigate("/");
  };

  return (
    <div className={`auth-wrapper ${isToggleActive ? "is-active" : ""}`}>
      <div className="auth-panel sign-up">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Tạo tài khoản</h1>
          <span>
            Điền thông tin cá nhân để kích hoạt quyền truy cập. Nếu không chọn
            chức vụ, hệ thống mặc định vai trò Khán giả.
          </span>
          <input
            type="text"
            placeholder="Tên tài khoản"
            value={registerUsername}
            onChange={(event) => setRegisterUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <input
            type="text"
            placeholder="Họ và tên"
            value={registerFullName}
            onChange={(event) => setRegisterFullName(event.target.value)}
            autoComplete="name"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={registerEmail}
            onChange={(event) => setRegisterEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="date"
            placeholder="Ngày sinh"
            value={registerDob}
            onChange={(event) => setRegisterDob(event.target.value)}
            required
          />
          <select
            value={registerPosition}
            onChange={(event) => setRegisterPosition(event.target.value)}
          >
            <option value="">Chọn chức vụ (tùy chọn)</option>
            <option value="Ban tổ chức giải">Ban tổ chức giải</option>
            <option value="Chủ đội bóng">Chủ đội bóng</option>
          </select>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={registerPassword}
            onChange={(event) => setRegisterPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={registerConfirmPassword}
            onChange={(event) => setRegisterConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          {registerError && (
            <p className="auth-error" role="alert">
              {registerError}
            </p>
          )}
          {registerNotice && (
            <p className="auth-success" role="status">
              {registerNotice}
            </p>
          )}
          <button type="submit" disabled={isRegistering}>
            {isRegistering ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>
      </div>

      <div className="auth-panel sign-in">
        <form onSubmit={handleSubmit}>
          <h1>Đăng nhập</h1>
          <span>Sử dụng email và mật khẩu được cấp</span>
          <input
            type="text"
            placeholder="Email hoặc tên đăng nhập"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {loginError && (
            <p className="auth-error" role="alert">
              {loginError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>

      <div className="auth-toggle">
        <div className="auth-toggle-inner">
          <div className="auth-toggle-panel auth-toggle-left">
            <h1>Chào mừng trở lại!</h1>
            <p>Đăng nhập để sử dụng toàn bộ tính năng của hệ thống.</p>
            <button
              type="button"
              className="toggle-btn"
              onClick={() => handleToggle(false)}
            >
              Đăng nhập
            </button>
          </div>
          <div className="auth-toggle-panel auth-toggle-right">
            <h1>Xin chào!</h1>
            <p>Chưa có tài khoản? Bấm để mở trang đăng ký và hoàn tất hồ sơ.</p>
            <button
              type="button"
              className="toggle-btn"
              onClick={() => handleToggle(true)}
            >
              Tạo tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

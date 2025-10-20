import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // Use the new Register.css
import { FaUser, FaLock } from 'react-icons/fa';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register');
            }

            setSuccess(data.message || 'Đăng ký thành công! Vui lòng chờ...');
            setTimeout(() => {
                navigate('/login');
            }, 2000); // Redirect to login after 2 seconds

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-card">
                <h3>Đăng ký</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <div className="input-group">
                        <FaUser className="icon" />
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label htmlFor="username">Tên đăng nhập</label>
                    </div>
                    <div className="input-group">
                        <FaLock className="icon" />
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label htmlFor="password">Mật khẩu</label>
                    </div>
                    <button type="submit" className="auth-button">Đăng ký</button>
                </form>
                <p className="switch-form-text">
                    Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

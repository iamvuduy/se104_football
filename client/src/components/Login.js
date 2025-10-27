import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-split-layout">
                <div className="auth-branding">
                </div>
                <div className="auth-form-container">
                    <div className="auth-branding-content">
                        <h1>Welcome Back</h1>
                        <p>Log in to manage your tournaments and teams.</p>
                    </div>
                    <div className="auth-form-card">
                        <h2>Login</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="username">Username</label>
                            </div>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="password">Password</label>
                                <span onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                                    {showPassword ? 'Hide' : 'Show'}
                                </span>
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" className="auth-button">Login</button>
                        </form>
                        <div className="switch-form-text">
                            Don't have an account? <Link to="/register">Register here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
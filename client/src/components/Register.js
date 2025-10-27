import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        try {
            await register(username, password);
            navigate('/');
        } catch (err) {
            setError('Failed to create an account. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-split-layout">
                <div className="auth-branding">
                </div>
                <div className="auth-form-container">
                    <div className="auth-branding-content">
                        <h1>Create Your Account</h1>
                        <p>Join our platform to manage your tournaments and teams.</p>
                    </div>
                    <div className="auth-form-card">
                        <h2>Register</h2>
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
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="confirmPassword">Confirm Password</label>
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" className="auth-button">Register</button>
                        </form>
                        <div className="switch-form-text">
                            Already have an account? <Link to="/login">Login here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

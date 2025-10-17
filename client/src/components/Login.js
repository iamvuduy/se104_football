import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2><span className="star">★</span> Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder=" "
                        />
                        <label>Username</label>
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder=" "
                        />
                        <label>Password</label>
                    </div>
                    <button type="submit" className="login-button">Submit</button>
                    <div className="error-message">
                        {error && <p>{error}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;

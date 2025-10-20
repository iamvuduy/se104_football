import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Details.css';
import { FaUsersCog, FaTrash } from 'react-icons/fa';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                setUsers(response.data);
            } catch (err) {
                setError('Failed to fetch users. You may not have permission.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/users/${userId}/role`, { role: newRole });
            setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
        } catch (err) {
            setError('Failed to update user role.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`/api/users/${userId}`);
                setUsers(users.filter(user => user.id !== userId));
            } catch (err) {
                setError('Failed to delete user.');
            }
        }
    };

    if (loading) {
        return <div className="registration-container"><p>Loading users...</p></div>;
    }

    if (error) {
        return <div className="registration-container"><div className="registration-form-card"><p>{error}</p></div></div>;
    }

    return (
        <div className="registration-container">
            <div className="registration-form-card">
                <h3 className="mb-3"><FaUsersCog /> User Management</h3>
                <div className="table-responsive">
                    <table className="table player-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.username === 'admin'}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={user.username === 'admin'}
                                            className="btn btn-danger"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css'; // Create this file for styling

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/users');
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
            await axios.put(`http://localhost:3001/api/users/${userId}/role`, { role: newRole });
            setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
        } catch (err) {
            setError('Failed to update user role.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:3001/api/users/${userId}`);
                setUsers(users.filter(user => user.id !== userId));
            } catch (err) {
                setError('Failed to delete user.');
            }
        }
    };

    if (loading) {
        return <div>Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="user-management-container">
            <h2>User Management</h2>
            <table className="users-table">
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
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    disabled={user.username === 'admin'} // Don't let admin change their own role
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </td>
                            <td>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={user.username === 'admin'} // Don't let admin delete themselves
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import NotificationModal from './NotificationModal';
import { useAuth } from '../context/AuthContext';
import './Details.css';
import { FaShieldAlt, FaUsers, FaEdit, FaTrash } from 'react-icons/fa';

const TeamDetails = () => {
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [notification, setNotification] = useState({ isOpen: false, type: '', message: '' });
    const { token } = useAuth();

    const handleCloseNotification = () => {
        setNotification({ isOpen: false, type: '', message: '' });
        if (notification.type === 'success' && notification.message.includes('deleted')) {
            navigate('/teams');
        }
    };

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const response = await axios.get(`/api/teams/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setTeam(response.data);
                setPlayers(response.data.players || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchTeamDetails();
        } else {
            setLoading(false);
        }
    }, [id, token]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await axios.delete(`/api/teams/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setNotification({ isOpen: true, type: 'success', message: 'Team deleted successfully!' });
            } catch (err) {
                setNotification({ isOpen: true, type: 'error', message: 'Failed to delete team.' });
            }
        }
    };

    if (loading) return <div className="registration-container"><p>Loading...</p></div>;
    if (error) return <div className="registration-container"><p>Error: {error}</p></div>;
    if (!team) return <div className="registration-container"><p>Team not found.</p></div>;

    return (
        <div className="registration-container">
            <NotificationModal 
                isOpen={notification.isOpen} 
                type={notification.type} 
                message={notification.message} 
                onClose={handleCloseNotification} 
            />
            <div className="registration-form-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="mb-0"><FaShieldAlt /> {team.name}</h2>
                    <div>
                        <Link to={`/teams/${id}/edit`} className="btn btn-primary me-2"><FaEdit /> Sửa</Link>
                        <button onClick={handleDelete} className="btn btn-danger"><FaTrash /> Xóa</button>
                    </div>
                </div>
                <p><strong>Sân nhà:</strong> {team.home_stadium}</p>
                
                <h3 className="mt-4 mb-3"><FaUsers /> Danh sách cầu thủ</h3>
                <div className="table-responsive">
                    <table className="table player-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên Cầu Thủ</th>
                                <th>Ngày Sinh</th>
                                <th>Loại</th>
                                <th>Ghi Chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player, index) => (
                                <tr key={player.id}>
                                    <td>{index + 1}</td>
                                    <td>{player.name}</td>
                                    <td>{new Date(player.dob).toLocaleDateString('vi-VN')}</td>
                                    <td>{player.type}</td>
                                    <td>{player.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeamDetails;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import NotificationModal from './NotificationModal';

const TeamDetails = () => {
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [notification, setNotification] = useState({ isOpen: false, type: '', message: '' });

    const handleCloseNotification = () => {
        setNotification({ isOpen: false, type: '', message: '' });
        if (notification.type === 'success') {
            navigate('/teams');
        }
    };

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/teams/${id}`);
                setTeam(response.data);
                setPlayers(response.data.players || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamDetails();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await axios.delete(`http://localhost:3001/api/teams/${id}`);
                setNotification({ isOpen: true, type: 'success', message: 'Team deleted successfully!' });
            } catch (err) {
                setNotification({ isOpen: true, type: 'error', message: 'Failed to delete team.' });
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!team) return <p>Team not found.</p>;

    return (
        <div>
            <NotificationModal 
                isOpen={notification.isOpen} 
                type={notification.type} 
                message={notification.message} 
                onClose={handleCloseNotification} 
            />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Chi tiết đội bóng: {team.name}</h2>
                <div>
                    <Link to={`/teams/${id}/edit`} className="btn btn-primary me-2">Sửa</Link>
                    <button onClick={handleDelete} className="btn btn-danger">Xóa</button>
                </div>
            </div>
            <p><strong>Sân nhà:</strong> {team.home_stadium}</p>
            
            <h3 className="mt-4 mb-3">Danh sách cầu thủ</h3>
            <table className="table table-striped table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>STT</th>
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
    );
};

export default TeamDetails;
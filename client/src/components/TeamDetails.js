import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TeamDetails = () => {
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!team) return <p>Team not found.</p>;

    return (
        <div>
            <h2 className="mb-3">Chi tiết đội bóng: {team.name}</h2>
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

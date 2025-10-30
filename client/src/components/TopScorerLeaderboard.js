import React, { useState, useEffect } from 'react';
import './TopScorerLeaderboard.css';
import { useAuth } from '../context/AuthContext';

const TopScorerLeaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchTopScorers = async () => {
            try {
                const response = await fetch('/api/leaderboard/top-scorers', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch top scorers');
                }
                const data = await response.json();
                setPlayers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchTopScorers();
        }
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="top-scorer-leaderboard-container">
            <h1>Danh Sách Các Cầu Thủ Ghi Bàn</h1>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Cầu Thủ</th>
                        <th>Đội</th>
                        <th>Loại Cầu Thủ</th>
                        <th>Số Bàn Thắng</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, index) => (
                        <tr key={player.id}>
                            <td>{index + 1}</td>
                            <td>{player.player_name}</td>
                            <td>{player.team_name}</td>
                            <td>{player.player_type}</td>
                            <td>{player.goals}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TopScorerLeaderboard;
import React, { useState, useEffect } from 'react';
import './TeamLeaderboard.css';
import { useAuth } from '../context/AuthContext';

const TeamLeaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('/api/leaderboard/teams', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch team leaderboard');
                }
                const data = await response.json();
                setTeams(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchLeaderboard();
        }
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="team-leaderboard-container">
            <h1>Bảng Xếp Hạng</h1>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Hạng</th>
                        <th>Đội</th>
                        <th>ST</th>
                        <th>Thắng</th>
                        <th>Hòa</th>
                        <th>Thua</th>
                        <th>HS</th>
                        <th>Điểm</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.id}>
                            <td>{index + 1}</td>
                            <td>{team.name}</td>
                            <td>{team.mp}</td>
                            <td>{team.wins}</td>
                            <td>{team.draws}</td>
                            <td>{team.losses}</td>
                            <td>{team.gd}</td>
                            <td>{team.pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamLeaderboard;
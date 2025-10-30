import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MatchResultList.css';

const MatchResultList = () => {
    const { token } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            fetch('/api/results', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    setMatches(data.data);
                } else {
                    setError('Failed to fetch match results.');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching match results:', err);
                setError('An error occurred while fetching match results.');
                setLoading(false);
            });
        }
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="match-result-list-container">
            <h3>Danh sách kết quả trận đấu</h3>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Đội 1</th>
                        <th>Tỷ số</th>
                        <th>Đội 2</th>
                        <th>Sân</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map(match => (
                        <tr key={match.id}>
                            <td>{new Date(match.match_date).toLocaleDateString()}</td>
                            <td>{match.match_time}</td>
                            <td>{match.team1_name}</td>
                            <td>{match.score}</td>
                            <td>{match.team2_name}</td>
                            <td>{match.stadium}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatchResultList;
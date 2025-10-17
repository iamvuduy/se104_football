import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TeamList = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/teams');
                setTeams(response.data.teams || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h2 className="mb-4">Danh sách đội bóng</h2>
            {teams.length === 0 ? (
                <p>Chưa có đội bóng nào được đăng ký.</p>
            ) : (
                <div className="list-group">
                    {teams.map(team => (
                        <Link key={team.id} to={`/teams/${team.id}`} className="list-group-item list-group-item-action">
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{team.name}</h5>
                            </div>
                            <p className="mb-1">Sân nhà: {team.home_stadium}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamList;

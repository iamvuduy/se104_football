import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./TeamRegistration.css"; // Import the template styles
import { MdStadium } from 'react-icons/md';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get("/api/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeams(response.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTeams();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading)
    return (
      <div className="registration-container">
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="registration-container">
        <p>Error: {error}</p>
      </div>
    );

  return (
    <div className="registration-container">
      <div className="registration-form-card">
<h3 className="mb-4"><MdStadium /> Danh sách đội bóng</h3>
        {teams.length === 0 ? (
          <p>Chưa có đội bóng nào được đăng ký.</p>
        ) : (
          <div className="list-group list-group-flush">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="list-group-item list-group-item-action"
              >
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">{team.name}</h5>
                  <small>{team.player_count} cầu thủ </small>
                </div>
                <p className="mb-1">Sân nhà: {team.home_stadium}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamList;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationModal from "./NotificationModal";
import { useAuth } from "../context/AuthContext";
import "./Details.css";
import { FaFutbol, FaUsers } from "react-icons/fa";

const TeamDetails = () => {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "",
    message: "",
  });
  const { token } = useAuth();

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, type: "", message: "" });
    if (
      notification.type === "success" &&
      notification.message.includes("thành công")
    ) {
      setTimeout(() => navigate("/teams"), 500);
    }
  };

  const fetchTeamDetails = async () => {
    try {
      const response = await axios.get(`/api/teams/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeam(response.data);
      setPlayers(response.data.players || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchTeamDetails();
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchTeamDetails();
    } else {
      setLoading(false);
    }
  }, [id, token]);

  if (loading)
    return (
      <div className="details-container">
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="details-container">
        <p>Error: {error}</p>
      </div>
    );
  if (!team)
    return (
      <div className="details-container">
        <p>Team not found.</p>
      </div>
    );

  return (
    <div className="details-container">
      <NotificationModal
        show={notification.isOpen}
        type={notification.type}
        message={notification.message}
        onClose={handleCloseNotification}
      />

      {/* Hero Section */}
      <div className="team-hero">
        <div className="team-info">
          <h1>{team.name}</h1>
          <div className="team-meta">
            <div className="team-meta-item">
              <strong>Mã đội:</strong> {team.team_code}
            </div>
            <div className="team-meta-item">
              <strong>Sân nhà:</strong> {team.home_stadium}
            </div>
          </div>
        </div>
        <button
          className="team-action ghost"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      {/* Content Section */}
      <div className="details-content">
        <div className="details-section-header">
          <FaUsers />
          <h2>Danh sách cầu thủ</h2>
        </div>

        <div className="details-table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã Cầu Thủ</th>
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
                  <td>{player.player_code || "-"}</td>
                  <td>{player.name}</td>
                  <td>{new Date(player.dob).toLocaleDateString("vi-VN")}</td>
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

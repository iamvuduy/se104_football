import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeft, FaFootballBall } from "react-icons/fa";
import "./MatchResults.css";

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [match, setMatch] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const axiosConfig = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch match details
        const matchResponse = await axios.get(
          `/api/results/${id}`,
          axiosConfig
        );
        setMatch(matchResponse.data?.data || matchResponse.data);

        // Fetch goals for this match
        const goalsResponse = await axios.get(
          `/api/results/${id}/goals`,
          axiosConfig
        );
        setGoals(goalsResponse.data?.data || []);
      } catch (err) {
        console.error("Error fetching match details:", err);
        setError(err.message || "Không thể tải thông tin trận đấu.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [id, token]);

  if (loading) {
    return (
      <div className="match-details-container">
        <div className="loading-container">
          <p className="loading-text">Đang tải thông tin trận đấu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-details-container">
        <div className="error-alert">
          <p>Lỗi: {error}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/match-results")}
          >
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="match-details-container">
        <div className="error-alert">
          <p>Không tìm thấy thông tin trận đấu.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/match-results")}
          >
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Group goals by team
  const team1Goals = goals.filter((g) => g.team_id === match.team1_id);
  const team2Goals = goals.filter((g) => g.team_id === match.team2_id);

  return (
    <div className="match-details-container">
      <button
        className="btn btn-secondary back-button"
        onClick={() => navigate("/match-results")}
      >
        <FaArrowLeft /> Quay lại
      </button>

      <div className="match-details-card">
        {/* Match Header */}
        <div className="match-header">
          <div className="match-code">Mã trận: {match.match_code || "—"}</div>
          <div className="match-date">
            {new Date(match.match_date).toLocaleDateString("vi-VN")}
            {match.match_time && ` - ${match.match_time}`}
          </div>
        </div>

        {/* Match Score */}
        <div className="match-score-section">
          <div className="team-score">
            <div className="team-name">{match.team1_name}</div>
            <div className="score-display">{match.score?.split("-")[0]}</div>
          </div>

          <div className="vs-separator">
            <div className="vs-text">vs</div>
          </div>

          <div className="team-score">
            <div className="team-name">{match.team2_name}</div>
            <div className="score-display">{match.score?.split("-")[1]}</div>
          </div>
        </div>

        {/* Match Info */}
        <div className="match-info-section">
          <div className="info-item">
            <span className="info-label">Sân:</span>
            <span className="info-value">{match.stadium || "—"}</span>
          </div>
        </div>

        {/* Goals Section */}
        <div className="goals-section">
          <h3>
            <FaFootballBall /> Danh sách ghi bàn
          </h3>

          <div className="goals-container">
            {/* Team 1 Goals */}
            <div className="team-goals">
              <h4>{match.team1_name}</h4>
              {team1Goals.length > 0 ? (
                <table className="goals-table">
                  <thead>
                    <tr>
                      <th>Cầu thủ</th>
                      <th>Phút</th>
                      <th>Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team1Goals.map((goal, index) => (
                      <tr key={`${goal.id}-${index}`}>
                        <td>{goal.player_name || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {goal.goal_time || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {goal.goal_type === "own"
                            ? "Phản lưới"
                            : goal.goal_type === "penalty"
                            ? "11m"
                            : "Bình thường"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-goals">Chưa ghi bàn</p>
              )}
            </div>

            {/* Team 2 Goals */}
            <div className="team-goals">
              <h4>{match.team2_name}</h4>
              {team2Goals.length > 0 ? (
                <table className="goals-table">
                  <thead>
                    <tr>
                      <th>Cầu thủ</th>
                      <th>Phút</th>
                      <th>Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team2Goals.map((goal, index) => (
                      <tr key={`${goal.id}-${index}`}>
                        <td>{goal.player_name || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {goal.goal_time || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {goal.goal_type === "own"
                            ? "Phản lưới"
                            : goal.goal_type === "penalty"
                            ? "11m"
                            : "Bình thường"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-goals">Chưa ghi bàn</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;

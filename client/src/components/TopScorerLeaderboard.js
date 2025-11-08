import React, { useState, useEffect } from "react";
import "./TopScorerLeaderboard.css";
import { useAuth } from "../context/AuthContext";

const TopScorerLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTopScorers = async () => {
      try {
        const response = await fetch("/api/leaderboard/top-scorers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch top scorers");
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

  const renderRowClass = (index) => {
    if (index === 0) {
      return "leaderboard-row rank-1";
    }
    if (index === 1) {
      return "leaderboard-row rank-2";
    }
    if (index === 2) {
      return "leaderboard-row rank-3";
    }
    return "leaderboard-row";
  };

  if (loading) {
    return (
      <div className="top-scorer-leaderboard loading-state">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Đang tải dữ liệu vua phá lưới...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-scorer-leaderboard error-state">
        <p>Không thể tải dữ liệu: {error}</p>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="top-scorer-leaderboard empty-state">
        <h1>Vua Phá Lưới</h1>
        <p>Chưa có cầu thủ nào ghi bàn để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="top-scorer-leaderboard">
      <header className="leaderboard-hero">
        <h1>Vua Phá Lưới</h1>
      </header>

      <section
        className="leaderboard-table-section"
        aria-label="Bảng xếp hạng chi tiết"
      >
        <div className="table-header">
          <h3>Toàn bộ danh sách</h3>
        </div>
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Cầu thủ</th>
                <th>Đội</th>
                <th>Loại cầu thủ</th>
                <th>Bàn thắng</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.id || `${player.player_name}-${index}`}
                  className={renderRowClass(index)}
                >
                  <td>#{index + 1}</td>
                  <td>{player.player_name}</td>
                  <td>{player.team_name}</td>
                  <td>{player.player_type}</td>
                  <td>{player.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TopScorerLeaderboard;

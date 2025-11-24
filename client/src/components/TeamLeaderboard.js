import React, { useState, useEffect } from "react";
import "./TeamLeaderboard.css";
import { useAuth } from "../context/AuthContext";

const TeamLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [generatedDate, setGeneratedDate] = useState("");
  const { token } = useAuth();

  const formatDisplayDate = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) {
      return date;
    }
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedDate) {
          params.append("asOf", selectedDate);
        }

        const query = params.toString();
        const response = await fetch(
          query ? `/api/leaderboard/teams?${query}` : `/api/leaderboard/teams`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch team leaderboard");
        }

        const data = await response.json();
        const leaderboardData = Array.isArray(data)
          ? data
          : data.leaderboard || [];

        setTeams(leaderboardData);
        setGeneratedDate(data.generatedAt || "");
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => controller.abort();
  }, [token, selectedDate]);

  if (loading) {
    return <div className="team-leaderboard-loading">Loading...</div>;
  }

  if (error) {
    return <div className="team-leaderboard-error">Error: {error}</div>;
  }

  return (
    <div className="team-leaderboard-shell">
      <div className="team-leaderboard-card">
        <header className="team-leaderboard-header">
          <span className="team-leaderboard-label">League Table</span>
          <h1>Team Standings</h1>
          <p>Updated automatically from the latest match results</p>
        </header>

        <div className="team-leaderboard-controls">
          <label htmlFor="leaderboard-date">Xem bảng xếp hạng đến ngày</label>
          <input
            id="leaderboard-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {generatedDate && (
            <span className="team-leaderboard-asof">
              Ngày dữ liệu: {formatDisplayDate(generatedDate)}
            </span>
          )}
        </div>

        <table className="team-leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>MP</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>DIFF</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const rowClass = [
                "team-leaderboard-row",
                index === 0 ? "team-leaderboard-row--leader" : "",
                index > 0 && index < 5 ? "team-leaderboard-row--top5" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr key={team.id || team._id || team.name} className={rowClass}>
                  <td>
                    <span className="team-leaderboard-rank">{index + 1}</span>
                  </td>
                  <td className="team-leaderboard-name-cell">
                    <div className="team-leaderboard-name">{team.name}</div>
                  </td>
                  <td>{team.mp ?? 0}</td>
                  <td>{team.wins ?? 0}</td>
                  <td>{team.draws ?? 0}</td>
                  <td>{team.losses ?? 0}</td>
                  <td className="team-leaderboard-diff">{team.gd ?? 0}</td>
                  <td className="team-leaderboard-points">{team.pts ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <footer className="team-leaderboard-footer">
          <span>Ligue 1 · Powered by your tournament data</span>
        </footer>
      </div>
    </div>
  );
};

export default TeamLeaderboard;

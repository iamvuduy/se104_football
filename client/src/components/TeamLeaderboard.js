import React, { useState, useEffect } from "react";
import "./TeamLeaderboard.css";
import { useAuth } from "../context/AuthContext";

const TeamLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch team leaderboard");
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

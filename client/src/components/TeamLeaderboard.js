import React, { useState, useEffect } from "react";
import "./TeamLeaderboard.css";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

const TeamLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false); // Default false as we don't load initially
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [rounds, setRounds] = useState([]);
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

    // Fetch available rounds
    const fetchRounds = async () => {
      try {
        const response = await fetch("/api/leaderboard/rounds", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const roundsData = await response.json();
          // Get the maximum round that has results
          const maxRound = roundsData.length > 0 
            ? Math.max(...roundsData.map(r => r.round)) 
            : 0;
          
          // Create array from 1 to maxRound (e.g., if max is 5: [1,2,3,4,5])
          const allRounds = maxRound > 0 
            ? Array.from({ length: maxRound }, (_, i) => i + 1)
            : [];
          
          setRounds(allRounds);
        }
      } catch (err) {
        console.error("Failed to fetch rounds:", err);
      }
    };

    fetchRounds();
  }, [token]);

  const fetchLeaderboard = async () => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append("asOf", selectedDate);
      }
      if (selectedRound) {
        params.append("round", selectedRound);
      }

      const query = params.toString();
      const response = await fetch(
        query ? `/api/leaderboard/teams?${query}` : `/api/leaderboard/teams`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      return leaderboardData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const data = await fetchLeaderboard();
    if (!data) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.map((team, index) => ({
        "Thứ hạng": index + 1,
        "Đội bóng": team.name,
        "Số trận": team.mp ?? 0,
        "Thắng": team.wins ?? 0,
        "Hòa": team.draws ?? 0,
        "Thua": team.losses ?? 0,
        "Hiệu số": team.gd ?? 0,
        "Điểm": team.pts ?? 0,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangXepHang");
    XLSX.writeFile(workbook, "BangXepHangDoiBong.xlsx");
  };

  const handleViewReport = async () => {
    await fetchLeaderboard();
  };

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
          <span className="team-leaderboard-label">Bảng xếp hạng</span>
          <h1>Bảng xếp hạng đội bóng</h1>
          <p>Cập nhật tự động từ kết quả trận đấu mới nhất</p>
        </header>

        <div className="team-leaderboard-controls">
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="leaderboard-round" className="filter-label">
                <span className="filter-icon">🏆</span>
                Vòng đấu
              </label>
              <select
                id="leaderboard-round"
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả vòng</option>
                {rounds.map(round => (
                  <option key={round} value={round}>{round}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="leaderboard-date" className="filter-label">
                <span className="filter-icon">📅</span>
                Thời điểm
              </label>
              <input
                id="leaderboard-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="filter-date"
              />
            </div>
          </div>

          <div className="export-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
            <button onClick={handleExportExcel} className="btn btn-success" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#28a745', color: 'white' }}>
              Xuất Excel
            </button>
            <button onClick={handleViewReport} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#007bff', color: 'white' }}>
              Xem Báo Cáo
            </button>
          </div>

          {generatedDate && (
            <div className="update-info">
              <span className="update-badge">Cập nhật: {formatDisplayDate(generatedDate)}</span>
            </div>
          )}
        </div>

        <table className="team-leaderboard-table">
          <thead>
            <tr>
              <th>Thứ hạng</th>
              <th>Đội bóng</th>
              <th>Số trận</th>
              <th>Số trận thắng</th>
              <th>Số trận hòa</th>
              <th>Số trận thua</th>
              <th>Hiệu số</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#7f8c9a' }}>
                  Vui lòng chọn "Xem Báo Cáo" hoặc "Xuất Excel" để xem dữ liệu.
                </td>
              </tr>
            ) : (
              teams.map((team, index) => {
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
              })
            )}
          </tbody>
        </table>

        <footer className="team-leaderboard-footer">
          <span>CE CUP 2025</span>
        </footer>
      </div>
    </div>
  );
};

export default TeamLeaderboard;

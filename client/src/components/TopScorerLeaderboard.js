import React, { useState, useEffect, useMemo } from "react";
import "./TopScorerLeaderboard.css";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

const TopScorerLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false); // Default false
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'domestic', 'foreign'
  const { token } = useAuth();

  const fetchTopScorers = async () => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leaderboard/top-scorers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách vua phá lưới");
      }

      const data = await response.json();
      const playersData = Array.isArray(data) ? data : [];
      setPlayers(playersData);
      return playersData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on selected filter
  const filteredPlayers = useMemo(() => {
    if (filter === "all") return players;
    if (filter === "domestic") {
      return players.filter(p => p.player_type === "Trong nước");
    }
    if (filter === "foreign") {
      return players.filter(p => p.player_type === "Ngoài nước");
    }
    return players;
  }, [players, filter]);

  const hasTrailingPlayers = filteredPlayers.length > 3;

  const handleExportExcel = async () => {
    const data = await fetchTopScorers();
    if (!data) return;

    // Apply filter logic to the fetched data for export if needed, 
    // but usually export might want to respect current view or export all.
    // The previous logic used 'filteredPlayers' which depends on state.
    // Since we just fetched, 'players' state might not be updated immediately in this closure if we rely on state.
    // However, we returned 'data' from fetchTopScorers.
    
    // Let's filter the returned data based on current filter state
    let exportData = data;
    if (filter === "domestic") {
      exportData = data.filter(p => p.player_type === "Trong nước");
    } else if (filter === "foreign") {
      exportData = data.filter(p => p.player_type === "Ngoài nước");
    }

    const worksheet = XLSX.utils.json_to_sheet(
      exportData.map((player, index) => ({
        "Hạng": index + 1,
        "Cầu thủ": player.player_name,
        "Đội bóng": player.team_name,
        "Loại cầu thủ": player.player_type,
        "Số bàn thắng": player.goals,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VuaPhaLuoi");
    XLSX.writeFile(workbook, "VuaPhaLuoi.xlsx");
  };

  const handleViewReport = async () => {
    await fetchTopScorers();
  };

  if (loading) {
    return (
      <div
        className="top-scorer-page is-loading"
        role="status"
        aria-live="polite"
      >
        <div className="ts-spinner" />
        <p>Đang tải bảng xếp hạng vua phá lưới...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-scorer-page is-error" role="alert">
        <h1>Vua Phá Lưới</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="top-scorer-page">
      <div className="ts-container">
        <header className="ts-hero">
          <div>
            <span className="ts-hero-badge">Thống kê mùa giải</span>
            <h1>Vua phá lưới</h1>
            <p>
              Theo dõi những chân sút xuất sắc nhất cùng số bàn thắng cập nhật
              theo thời gian thực.
            </p>
          </div>
          <div className="ts-meta">
            <article>
              <span>Tổng cầu thủ</span>
              <strong>{filteredPlayers.length}</strong>
            </article>
            <article>
              <span>Bàn thắng cao nhất</span>
              <strong>{filteredPlayers[0]?.goals ?? 0}</strong>
            </article>
          </div>
        </header>

        <section className="ts-table-section" aria-label="Danh sách đầy đủ">
          <header className="ts-table-header">
            <div>
              <h3>DANH SÁCH</h3>
            </div>
            
            {/* Filter Buttons */}
            <div className="ts-filter-buttons">
              <button
                className={`ts-filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              <button
                className={`ts-filter-btn ${filter === "domestic" ? "active" : ""}`}
                onClick={() => setFilter("domestic")}
              >
                Trong nước
              </button>
              <button
                className={`ts-filter-btn ${filter === "foreign" ? "active" : ""}`}
                onClick={() => setFilter("foreign")}
              >
                Ngoài nước
              </button>
            </div>
          </header>

          <div className="ts-export-buttons" style={{ display: 'flex', gap: '10px', padding: '0 24px 16px', justifyContent: 'flex-end' }}>
            <button onClick={handleExportExcel} className="btn btn-success" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#28a745', color: 'white' }}>
              Xuất Excel
            </button>
            <button onClick={handleViewReport} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#007bff', color: 'white' }}>
              Xem Báo Cáo
            </button>
          </div>

          <div className="ts-table-wrapper">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Cầu thủ</th>
                  <th>Đội bóng</th>
                  <th>Loại cầu thủ</th>
                  <th>Số bàn</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#7f8c9a' }}>
                      {players.length === 0 
                        ? "Vui lòng chọn \"Xem Báo Cáo\" hoặc \"Xuất Excel\" để xem dữ liệu." 
                        : "Không có cầu thủ nào trong danh sách lọc này."}
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player, index) => (
                    <tr
                      key={player.id || `${player.player_name}-${index}`}
                      className={index < 3 ? "ts-row-highlight" : ""}
                    >
                      <td>#{index + 1}</td>
                      <td>
                        <span className="ts-name">{player.player_name}</span>
                      </td>
                      <td>{player.team_name}</td>
                      <td>
                        <span className="ts-type">{player.player_type}</span>
                      </td>
                      <td>
                        <span className="ts-goal-count">{player.goals}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!hasTrailingPlayers ? null : (
            <footer className="ts-table-footnote">
              <p>
                * Bảng xếp hạng cập nhật khi có thay đổi ở kết quả các trận đấu.
              </p>
            </footer>
          )}
        </section>
      </div>
    </div>
  );
};

export default TopScorerLeaderboard;

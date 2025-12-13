import React, { useState, useEffect, useMemo } from "react";
import "./TopScorerLeaderboard.css";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

const TopScorerLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'domestic', 'foreign'
  const [reportStatus, setReportStatus] = useState(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [isReportPublished, setIsReportPublished] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const { token, user, canAccessFeature } = useAuth();

  const isOrgnanizer = user?.role === "tournament_admin";

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
      return players.filter((p) => p.player_type === "Trong nước");
    }
    if (filter === "foreign") {
      return players.filter((p) => p.player_type === "Ngoài nước");
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
      exportData = data.filter((p) => p.player_type === "Trong nước");
    } else if (filter === "foreign") {
      exportData = data.filter((p) => p.player_type === "Ngoài nước");
    }

    const worksheet = XLSX.utils.json_to_sheet(
      exportData.map((player, index) => ({
        Hạng: index + 1,
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

  const loadLatestTopScorers = async () => {
    try {
      const response = await fetch("/api/leaderboard/top-scorers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Không thể tải bảng xếp hạng vua phá lưới");
        setPlayers([]);
        setIsReportPublished(false);
      } else {
        const playersData = Array.isArray(response)
          ? response
          : await response.json();
        setPlayers(Array.isArray(playersData) ? playersData : []);
        setError(null);
        setIsReportPublished(true);
      }
    } catch (err) {
      setError(err.message);
      setPlayers([]);
      setIsReportPublished(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    // Auto-load latest top scorers for all users
    loadLatestTopScorers();

    // Check report status for admin
    if (isOrgnanizer) {
      checkReportStatus();
    }
  }, [token]);

  const handleCreateReport = async () => {
    setIsCreatingReport(true);
    setReportMessage("");

    try {
      const response = await fetch("/api/leaderboard/reports/top-scorer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ round: 0 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReportMessage(data.error || "Lỗi khi lập báo cáo");
        setToast({
          message: data.error || "Lỗi khi lập báo cáo",
          type: "error",
        });
      } else {
        setReportMessage(data.message);
        setToast({
          message: "Lập báo cáo thành công!",
          type: "success",
        });
        // Wait a moment then check report status
        setTimeout(() => {
          checkReportStatus();
        }, 500);
      }
    } catch (error) {
      setReportMessage("Lỗi khi lập báo cáo: " + error.message);
      setToast({
        message: "Lỗi khi lập báo cáo: " + error.message,
        type: "error",
      });
    } finally {
      setIsCreatingReport(false);
    }
  };

  const handlePublishReport = async () => {
    try {
      const response = await fetch(
        `/api/leaderboard/reports/top-scorer/0/publish`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setReportMessage(data.error || "Lỗi khi công khai báo cáo");
        setToast({
          message: data.error || "Lỗi khi công khai báo cáo",
          type: "error",
        });
        return;
      }

      const data = await response.json();
      setReportMessage("");
      setToast({
        message: "Báo cáo đã được công khai thành công!",
        type: "success",
      });

      // Wait a moment then check report status and reload
      setTimeout(() => {
        checkReportStatus();
        loadLatestTopScorers();
      }, 300);
    } catch (error) {
      setReportMessage("Lỗi khi công khai báo cáo: " + error.message);
      setToast({
        message: "Lỗi khi công khai báo cáo: " + error.message,
        type: "error",
      });
    }
  };

  const handleUnpublishReport = async () => {
    try {
      const response = await fetch(
        `/api/leaderboard/reports/top-scorer/0/unpublish`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReportMessage(data.error || "Lỗi khi ẩn báo cáo");
        setToast({
          message: data.error || "Lỗi khi ẩn báo cáo",
          type: "error",
        });
      } else {
        setReportMessage(
          "✓ Báo cáo đã được ẩn khỏi người dùng khác. Bạn có thể chỉnh sửa và công khai lại sau."
        );
        setToast({
          message: "Báo cáo đã được ẩn thành công!",
          type: "success",
        });
        await checkReportStatus();
      }
    } catch (error) {
      setReportMessage("Lỗi khi ẩn báo cáo: " + error.message);
      setToast({
        message: "Lỗi khi ẩn báo cáo: " + error.message,
        type: "error",
      });
    }
  };

  const checkReportStatus = async () => {
    if (!isOrgnanizer) return;

    try {
      const response = await fetch(`/api/leaderboard/reports/status/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const reports = await response.json();
        const scorerReport = reports.find(
          (r) => r.round === 0 && r.type === "top_scorer_leaderboard"
        );
        setReportStatus(scorerReport);
      } else {
        console.error("Failed to fetch report status:", response.status);
      }
    } catch (error) {
      console.error("Failed to check report status:", error);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isOrgnanizer) {
      checkReportStatus();
    }
  }, []);

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
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: toast.type === "success" ? "#28a745" : "#dc3545",
            color: "white",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            animation:
              "slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s forwards",
          }}
        >
          {toast.message}
        </div>
      )}

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
            <div className="ts-table-header-left">
              <h3>DANH SÁCH</h3>
              {/* Filter Buttons */}
              <div className="ts-filter-buttons">
                <button
                  className={`ts-filter-btn ${
                    filter === "all" ? "active" : ""
                  }`}
                  onClick={() => setFilter("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`ts-filter-btn ${
                    filter === "domestic" ? "active" : ""
                  }`}
                  onClick={() => setFilter("domestic")}
                >
                  Trong nước
                </button>
                <button
                  className={`ts-filter-btn ${
                    filter === "foreign" ? "active" : ""
                  }`}
                  onClick={() => setFilter("foreign")}
                >
                  Ngoài nước
                </button>
              </div>
            </div>

            <div className="ts-export-buttons">
              <button
                onClick={handleExportExcel}
                className="ts-export-btn success"
              >
                Xuất Excel
              </button>
              {isOrgnanizer && canAccessFeature("create_reports") && (
                <>
                  <button
                    onClick={handleCreateReport}
                    disabled={isCreatingReport}
                    className="ts-export-btn warning"
                    style={{
                      cursor: isCreatingReport ? "not-allowed" : "pointer",
                      opacity: isCreatingReport ? 0.6 : 1,
                    }}
                  >
                    {isCreatingReport ? "Đang lập..." : "Lập Báo Cáo"}
                  </button>

                  {reportStatus && (
                    <>
                      {reportStatus.is_published === 0 && (
                        <button
                          onClick={handlePublishReport}
                          className="ts-export-btn primary"
                          title="Chia sẻ báo cáo cho người dùng khác (sau khi chia sẻ, người dùng khác có thể xem bảng xếp hạng này)"
                        >
                          Chia Sẻ Báo Cáo
                        </button>
                      )}
                      {reportStatus.is_published === 1 && (
                        <button
                          onClick={handleUnpublishReport}
                          className="ts-export-btn danger"
                          title="Ẩn báo cáo khỏi người dùng khác để chỉnh sửa (sau khi ẩn, người dùng khác sẽ không thể xem bảng xếp hạng này)"
                        >
                          Ẩn Báo Cáo
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </header>

          {reportMessage && (
            <div
              style={{
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                backgroundColor: reportMessage.includes("Lỗi")
                  ? "#f8d7da"
                  : "#d4edda",
                color: reportMessage.includes("Lỗi") ? "#721c24" : "#155724",
                border: `1px solid ${
                  reportMessage.includes("Lỗi") ? "#f5c6cb" : "#c3e6cb"
                }`,
              }}
            >
              {reportMessage}
            </div>
          )}

          {error && !isReportPublished && (
            <div
              style={{
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

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
                    <td
                      colSpan="5"
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#7f8c9a",
                      }}
                    >
                      {players.length === 0
                        ? "Chưa cập nhật bảng xếp hạng vua phá lưới"
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

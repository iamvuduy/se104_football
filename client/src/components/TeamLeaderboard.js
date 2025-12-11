import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./TeamLeaderboard.css";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import NotificationModal from "./NotificationModal";

const TeamLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [rounds, setRounds] = useState([]);
  const [generatedDate, setGeneratedDate] = useState("");
  const [reportStatus, setReportStatus] = useState(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [isReportPublished, setIsReportPublished] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const { token, user, canAccessFeature } = useAuth();

  const isOrgnanizer = user?.role === "tournament_admin";

  // Memoized parsed roundId to prevent string concatenation issues
  const roundId = useMemo(
    () => (selectedRound ? parseInt(selectedRound, 10) : null),
    [selectedRound]
  );

  const formatDisplayDate = (date) => {
    if (!date) return "";

    try {
      // Handle ISO 8601 datetime string (e.g., "2025-12-10T14:13:34.331Z")
      const dateObj = new Date(date);

      if (isNaN(dateObj.getTime())) {
        return date;
      }

      // Format: dd/MM/yyyy HH:mm
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return date;
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    // Fetch available rounds for admin
    const fetchRounds = async () => {
      try {
        const response = await fetch("/api/leaderboard/rounds", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const roundsData = await response.json();
          const maxRound =
            roundsData.length > 0
              ? Math.max(...roundsData.map((r) => r.round))
              : 0;

          const allRounds =
            maxRound > 0
              ? Array.from({ length: maxRound }, (_, i) => i + 1)
              : [];

          setRounds(allRounds);
        }
      } catch (err) {
        console.error("Failed to fetch rounds:", err);
      }
    };

    fetchRounds();

    // Auto-load latest leaderboard for all users
    const loadLatestLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/leaderboard/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Không thể tải bảng xếp hạng");
          setTeams([]);
          setIsReportPublished(false);
        } else {
          const data = await response.json();
          const leaderboardData = Array.isArray(data)
            ? data
            : data.leaderboard || [];

          setTeams(leaderboardData);
          setGeneratedDate(data.generatedAt || "");
          setError(null);
          setIsReportPublished(true);
        }
      } catch (err) {
        setError(err.message);
        setTeams([]);
        setIsReportPublished(false);
      } finally {
        setLoading(false);
      }
    };

    loadLatestLeaderboard();
  }, [token]);

  const fetchLeaderboard = useCallback(async () => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      // For non-admin users with round filter, check if report is published first
      if (!isOrgnanizer && roundId) {
        const reportResponse = await fetch(
          `/api/leaderboard/reports/team/${roundId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!reportResponse.ok) {
          setNotification({
            show: true,
            message: "Chưa có bảng xếp hạng cho vòng này",
            type: "warning",
          });
          setTeams([]);
          setIsReportPublished(false);
          setLoading(false);
          return null;
        }

        const reportData = await reportResponse.json();
        if (!reportData.is_published) {
          setNotification({
            show: true,
            message: "Chưa có bảng xếp hạng cho vòng này",
            type: "warning",
          });
          setTeams([]);
          setIsReportPublished(false);
          setLoading(false);
          return null;
        }

        // Use report data
        let leaderboardData = reportData.data || [];

        // Handle if data is nested object with leaderboard property
        if (leaderboardData && !Array.isArray(leaderboardData)) {
          leaderboardData = leaderboardData.leaderboard || [];
        }

        // Ensure it's always an array
        if (!Array.isArray(leaderboardData)) {
          leaderboardData = [];
        }

        setTeams(leaderboardData);
        setGeneratedDate(reportData.created_at || "");
        setError(null);
        setIsReportPublished(true);
        setLoading(false);
        return leaderboardData;
      }

      // For admin or viewing published reports, use regular API or report API
      let url = "/api/leaderboard/teams";
      const params = new URLSearchParams();

      if (selectedDate) {
        params.append("asOf", selectedDate);
      }

      // If there's a roundId, always add it as a parameter
      if (roundId) {
        params.append("round", roundId);
      }

      const query = params.toString();
      const response = await fetch(query ? `${url}?${query}` : url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Không thể tải bảng xếp hạng");
        setTeams([]);
        setIsReportPublished(false);
        return null;
      }

      const data = await response.json();
      const leaderboardData = Array.isArray(data)
        ? data
        : data.leaderboard || [];

      setTeams(leaderboardData);
      setGeneratedDate(data.generatedAt || "");
      setError(null);
      setIsReportPublished(true);
      return leaderboardData;
    } catch (err) {
      setError(err.message);
      setTeams([]);
      setIsReportPublished(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, isOrgnanizer, roundId, selectedDate]);

  const handleExportExcel = async () => {
    const data = await fetchLeaderboard();
    if (!data) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.map((team, index) => ({
        "Thứ hạng": index + 1,
        "Đội bóng": team.name,
        "Số trận": team.mp ?? 0,
        Thắng: team.wins ?? 0,
        Hòa: team.draws ?? 0,
        Thua: team.losses ?? 0,
        "Hiệu số": team.gd ?? 0,
        Điểm: team.pts ?? 0,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangXepHang");
    XLSX.writeFile(workbook, "BangXepHangDoiBong.xlsx");
  };

  const handleViewReport = async () => {
    await fetchLeaderboard();
  };

  const handleCreateReport = async () => {
    setIsCreatingReport(true);
    setReportMessage("");

    try {
      // Nếu có chọn vòng, lập báo cáo cho vòng đó, nếu không thì lập báo cáo tổng (tất cả vòng)
      const endpoint = roundId
        ? "/api/leaderboard/reports/team"
        : "/api/leaderboard/reports/team/all";

      const body = roundId
        ? JSON.stringify({ round: roundId })
        : JSON.stringify({});

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        setReportMessage(data.error || "Lỗi khi lập báo cáo");
        setToast({
          message: data.error || "Lỗi khi lập báo cáo",
          type: "error",
        });
      } else {
        // Report created but not published yet (still in draft state)
        setReportMessage("");
        setToast({
          message: "Báo cáo lập thành công! Sẵn sàng để công khai.",
          type: "success",
        });
        // Wait a moment then check report status
        // Tạo report status tạm thời nếu API chưa trả về
        const tempReport = {
          round: roundId || 0, // 0 cho báo cáo tổng
          type: "team_leaderboard",
          is_published: 0,
          created_at: new Date().toISOString(),
        };
        console.log("Setting temporary report status:", tempReport);
        setReportStatus(tempReport);
        // Sau đó fetch lại từ API - chỉ fetch nếu có roundId
        if (roundId) {
          setTimeout(async () => {
            console.log(
              "Fetching report status after create, roundId:",
              roundId
            );
            if (!isOrgnanizer) return;
            try {
              const response = await fetch(
                `/api/leaderboard/reports/status/all`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                const reports = await response.json();
                console.log(
                  "Reports from API:",
                  reports,
                  "Looking for round:",
                  roundId
                );
                const teamReport = reports.find(
                  (r) =>
                    parseInt(r.round) === parseInt(roundId) &&
                    r.type === "team_leaderboard"
                );
                console.log("Found report:", teamReport);
                if (teamReport) {
                  setReportStatus(teamReport);
                }
              }
            } catch (error) {
              console.error("Failed to check report status:", error);
            }
          }, 800);
        }
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
    if (!reportStatus) {
      alert("Vui lòng lập báo cáo trước");
      return;
    }

    const round = reportStatus.round || 0;

    try {
      const response = await fetch(
        `/api/leaderboard/reports/team/${round}/publish`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReportMessage(data.error || "Lỗi khi công khai báo cáo");
        setToast({
          message: data.error || "Lỗi khi công khai báo cáo",
          type: "error",
        });
        return;
      }

      setReportMessage("");
      setToast({
        message: "Báo cáo đã được công khai thành công!",
        type: "success",
      });

      // Wait a moment then check report status and reload
      setTimeout(() => {
        checkReportStatus();
        loadLatestLeaderboard();
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
    if (!reportStatus) {
      alert("Vui lòng lập báo cáo trước");
      return;
    }

    const round = reportStatus.round || 0;

    try {
      const response = await fetch(
        `/api/leaderboard/reports/team/${round}/unpublish`,
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

  const checkIfReportNeedsUpdate = useCallback(async () => {
    if (!roundId || !isOrgnanizer) return;

    try {
      const response = await fetch(
        `/api/leaderboard/reports/team/${roundId}/needs-update`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNeedsUpdate(data.needsUpdate);
      }
    } catch (error) {
      console.error("Failed to check if report needs update:", error);
    }
  }, [roundId, isOrgnanizer, token]);

  const checkReportStatus = useCallback(async () => {
    if (!isOrgnanizer) return;

    try {
      const response = await fetch(`/api/leaderboard/reports/status/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const reports = await response.json();
        console.log(
          "Reports fetched:",
          reports,
          "Looking for round:",
          roundId,
          "Type: team_leaderboard"
        );

        // Nếu có roundId, tìm báo cáo của vòng đó, nếu không thì tìm báo cáo tổng (round = 0)
        const searchRound = roundId !== null ? parseInt(roundId) : 0;
        const teamReport = reports.find(
          (r) =>
            parseInt(r.round) === searchRound && r.type === "team_leaderboard"
        );
        console.log("Found report:", teamReport);

        if (teamReport) {
          setReportStatus(teamReport);
          // Check if report needs update
          if (teamReport.is_published) {
            checkIfReportNeedsUpdate();
          } else {
            setNeedsUpdate(false);
          }
        } else {
          // Report không tìm thấy, nhưng có thể vừa được tạo với is_published=0
          // Retry sau 1 giây
          console.warn("Report not found, retrying...");
          setTimeout(() => {
            checkReportStatus();
          }, 1000);
        }
      } else {
        console.error("Failed to fetch report status:", response.status);
      }
    } catch (error) {
      console.error("Failed to check report status:", error);
    }
  }, [roundId, isOrgnanizer, token, checkIfReportNeedsUpdate]);

  const loadLatestLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Không thể tải bảng xếp hạng");
        setTeams([]);
        setIsReportPublished(false);
      } else {
        const data = await response.json();
        const leaderboardData = Array.isArray(data)
          ? data
          : data.leaderboard || [];

        setTeams(leaderboardData);
        setGeneratedDate(data.generatedAt || "");
        setError(null);
        setIsReportPublished(true);
      }
    } catch (err) {
      setError(err.message);
      setTeams([]);
      setIsReportPublished(false);
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

  // Auto-reload leaderboard when filter changes
  useEffect(() => {
    if (!token) return;

    // Always fetch when filters or role change
    fetchLeaderboard();
  }, [roundId, selectedDate, token, isOrgnanizer, fetchLeaderboard]);

  // Check report status when round changes for admin
  useEffect(() => {
    if (isOrgnanizer && roundId) {
      checkReportStatus();
    }
  }, [roundId, isOrgnanizer, checkReportStatus]);

  if (loading) {
    return <div className="team-leaderboard-loading">Loading...</div>;
  }

  return (
    <div className="team-leaderboard-shell">
      <NotificationModal
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() =>
          setNotification({ show: false, message: "", type: "info" })
        }
      />

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
                <option value="">
                  {isOrgnanizer
                    ? "Chọn vòng để lập báo cáo"
                    : "Tất cả các vòng"}
                </option>
                {rounds.map((round) => (
                  <option key={round} value={round}>
                    Vòng {round}
                  </option>
                ))}
              </select>
            </div>

            {isOrgnanizer && (
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
            )}
          </div>

          <div
            className="export-buttons"
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleExportExcel}
              className="btn btn-success"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#28a745",
                color: "white",
              }}
            >
              Xuất Excel
            </button>

            {/* Show report buttons only if user has create_reports permission */}
            {isOrgnanizer && canAccessFeature("create_reports") && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {console.log(
                  "Rendering buttons, reportStatus:",
                  reportStatus,
                  "roundId:",
                  roundId
                )}
                {/* Button Lập Báo Cáo */}
                <button
                  onClick={handleCreateReport}
                  disabled={isCreatingReport}
                  className="btn btn-warning"
                  title="Tạo/cập nhật bảng xếp hạng cho vòng đấu (nếu chọn) hoặc tất cả vòng (nếu không chọn). Báo cáo sẽ ở trạng thái draft, người dùng khác không thể xem"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: isCreatingReport ? "not-allowed" : "pointer",
                    backgroundColor: "#ffc107",
                    color: "#333",
                    opacity: isCreatingReport ? 0.6 : 1,
                    position: "relative",
                    fontWeight: "500",
                  }}
                >
                  {isCreatingReport ? "Đang lập..." : "Lập Báo Cáo"}
                  {needsUpdate && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                      title="Có dữ liệu mới cần cập nhật"
                    >
                      !
                    </span>
                  )}
                </button>

                {/* Button Chia Sẻ Báo Cáo (Publish) */}
                {reportStatus?.is_published === 0 && (
                  <button
                    onClick={handlePublishReport}
                    className="btn btn-success"
                    title="Chia sẻ báo cáo cho người dùng khác (sau khi chia sẻ, người dùng khác có thể xem bảng xếp hạng này)"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#5b8ddb",
                      color: "white",
                      fontWeight: "500",
                    }}
                  >
                    Chia Sẻ Báo Cáo
                  </button>
                )}

                {/* Button Ẩn Báo Cáo (Unpublish) */}
                {reportStatus && reportStatus.is_published === 1 && (
                  <button
                    onClick={handleUnpublishReport}
                    className="btn btn-danger"
                    title="Ẩn báo cáo khỏi người dùng khác để chỉnh sửa (sau khi ẩn, người dùng khác sẽ không thể xem bảng xếp hạng này)"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#dc3545",
                      color: "white",
                      fontWeight: "500",
                    }}
                  >
                    Ẩn Báo Cáo
                  </button>
                )}
              </div>
            )}
          </div>

          {needsUpdate && isOrgnanizer && selectedRound && (
            <div
              style={{
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                backgroundColor: "#fff3cd",
                color: "#856404",
                border: "1px solid #ffeaa7",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚠️</span>
              <span>
                Có dữ liệu mới cần cập nhật. Hãy ấn "Lập Báo Cáo" để cập nhật
                bảng xếp hạng mới nhất.
              </span>
            </div>
          )}

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

          {generatedDate && isReportPublished && (
            <div className="update-info">
              <span className="update-badge">
                Cập nhật: {formatDisplayDate(generatedDate)}
              </span>
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
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#7f8c9a",
                  }}
                >
                  Chưa cập nhật bảng xếp hạng
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
                  <tr
                    key={team.id || team._id || team.name}
                    className={rowClass}
                  >
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

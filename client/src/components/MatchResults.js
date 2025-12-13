import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./MatchResults.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import MatchForm from "./MatchForm";

const MatchResults = () => {
  const { token, canAccessFeature } = useAuth();
  const canViewResults = canAccessFeature("view_match_results");
  const canEditResults = canAccessFeature("record_match_results");
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const itemsPerPage = 5;

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingMatchData, setViewingMatchData] = useState(null);
  const [viewingMatchGoals, setViewingMatchGoals] = useState([]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const axiosConfig = useMemo(() => {
    if (!token) return null;
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, [token]);

  const loadResults = async () => {
    if (!axiosConfig) return;

    setLoading(true);
    setError("");

    try {
      const [resultsRes, teamsRes, settingsRes, schedulesRes] =
        await Promise.allSettled([
          axios.get("/api/results", axiosConfig),
          axios.get("/api/teams", axiosConfig),
          axios.get("/api/settings", axiosConfig),
          axios.get("/api/schedules", axiosConfig),
        ]);

      if (resultsRes.status === "fulfilled") {
        setResults(resultsRes.value.data?.data || []);
      }
      if (teamsRes.status === "fulfilled") {
        setTeams(teamsRes.value.data?.data || []);
      }
      if (settingsRes.status === "fulfilled") {
        setSettings(settingsRes.value.data?.data || null);
      }
      if (schedulesRes.status === "fulfilled") {
        setSchedules(schedulesRes.value.data?.data || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!axiosConfig) {
      setLoading(false);
      return;
    }
    loadResults();
  }, [axiosConfig]);

  const handleEdit = async (matchId) => {
    const matchToEdit = results.find((m) => m.id === matchId);
    if (!matchToEdit) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/results/${matchId}/goals`,
        axiosConfig
      );

      if (response.status !== 200) throw new Error("Failed to fetch goals");

      const matchGoals = response.data?.data || [];

      const preparedData = {
        matchInfo: {
          matchId: "",
          team1: String(matchToEdit.team1_id),
          team2: String(matchToEdit.team2_id),
          score: matchToEdit.score,
          stadium: matchToEdit.stadium,
          date: matchToEdit.match_date
            ? matchToEdit.match_date.split("T")[0]
            : "",
          time: matchToEdit.match_time || "",
        },
        goals: matchGoals.map((g) => ({
          player: String(g.player_id),
          team: String(g.team_id),
          type: g.goal_type,
          time: g.goal_time,
          // goalCode được tự sinh từ backend - không cần gửi
        })),
      };

      setEditData(preparedData);
      setEditingMatchId(matchId);
      setShowEditModal(true);
      setLoading(false);
    } catch (err) {
      console.error("Error preparing edit:", err);
      setToast({
        message: "Không thể tải thông tin trận đấu để sửa.",
        type: "error",
      });
      setLoading(false);
    }
  };

  const handleUpdate = async (matchInfo, goals) => {
    if (!editingMatchId) return;

    const normalizedMatchInfo = {
      ...matchInfo,
      team1: String(matchInfo.team1 || ""),
      team2: String(matchInfo.team2 || ""),
    };

    const normalizedGoals = goals.map((goal) => ({
      ...goal,
      team: String(goal.team || ""),
      player: String(goal.player || ""),
      time: goal.time,
    }));

    try {
      const response = await axios.put(
        `/api/results/${editingMatchId}`,
        {
          matchInfo: normalizedMatchInfo,
          goals: normalizedGoals,
        },
        axiosConfig
      );

      if (response.status === 200) {
        setToast({
          message: "Cập nhật kết quả thành công!",
          type: "success",
        });
        setShowEditModal(false);
        setEditingMatchId(null);
        setEditData(null);
        loadResults();
      }
    } catch (error) {
      console.error("Error updating match result:", error);
      setToast({
        message: error.response?.data?.error || "Đã xảy ra lỗi khi cập nhật.",
        type: "error",
      });
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingMatchId(null);
    setEditData(null);
  };

  const handleView = async (matchId) => {
    try {
      const match = results.find((m) => m.id === matchId);
      if (!match) return;

      const goalsResponse = await axios.get(
        `/api/results/${matchId}/goals`,
        axiosConfig
      );

      setViewingMatchData(match);
      setViewingMatchGoals(goalsResponse.data?.data || []);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching match details:", err);
      setToast({
        message: "Không thể tải thông tin trận đấu.",
        type: "error",
      });
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingMatchData(null);
    setViewingMatchGoals([]);
  };

  const handleDelete = async (matchId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa kết quả trận đấu này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/results/${matchId}`, axiosConfig);
      setToast({
        message: "Đã xóa kết quả trận đấu thành công!",
        type: "success",
      });
      loadResults();
    } catch (err) {
      console.error("Error deleting match result:", err);
      setToast({
        message: err.response?.data?.error || "Có lỗi xảy ra khi xóa kết quả.",
        type: "error",
      });
    }
  };

  const handleCreateNew = () => {
    navigate("/record-result");
  };

  // Get round from schedule for a match
  const getMatchRound = (match) => {
    const schedule = schedules.find(
      (s) => s.team1_id === match.team1_id && s.team2_id === match.team2_id
    );
    return schedule?.round ? parseInt(schedule.round) : null;
  };

  // Get unique rounds from schedules - show all rounds from 1 to max
  const availableRounds = useMemo(() => {
    const rounds = schedules
      .map((s) => parseInt(s.round))
      .filter((r) => !isNaN(r) && r > 0);

    if (rounds.length === 0) return [];

    const maxRound = Math.max(...rounds);
    // Generate continuous array from 1 to maxRound
    return Array.from({ length: maxRound }, (_, i) => i + 1);
  }, [schedules]);

  // Filter results by selected round
  const filteredResults = useMemo(() => {
    let filtered = results;

    if (selectedRound) {
      const targetRound = parseInt(selectedRound);
      filtered = filtered.filter((match) => {
        const matchRound = getMatchRound(match);
        return matchRound === targetRound;
      });
    }

    if (selectedTeam) {
      const targetTeamId = parseInt(selectedTeam);
      filtered = filtered.filter((match) => {
        return (
          match.team1_id === targetTeamId || match.team2_id === targetTeamId
        );
      });
    }

    return filtered;
  }, [results, selectedRound, selectedTeam, schedules]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const currentResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, currentPage]);

  if (!token) {
    return (
      <div className="match-results-container">
        <div className="match-results-card">
          <h2>
            <FaTrophy /> Yêu cầu đăng nhập
          </h2>
          <p>Bạn cần đăng nhập để truy cập chức năng này.</p>
        </div>
      </div>
    );
  }

  if (loading && !showEditModal) {
    return (
      <div className="match-results-container">
        <div className="loading-container">
          <p className="loading-text">Đang tải kết quả trận đấu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="match-results-container">
      <div className="match-results-header">
        <div>
          <h2>Kết quả trận đấu</h2>
          <p>Danh sách tất cả các trận đấu đã được ghi nhận kết quả</p>
        </div>
      </div>

      {error && (
        <div className="error-alert" onClick={() => setError("")}>
          {error} — nhấn để ẩn.
        </div>
      )}

      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}
          {toast.message}
        </div>
      )}

      <div className="match-results-card">
        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="round-filter" className="filter-label">
              Lọc theo vòng
            </label>
            <select
              id="round-filter"
              value={selectedRound}
              onChange={(e) => {
                setSelectedRound(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">Tất cả các vòng</option>
              {availableRounds.map((round) => (
                <option key={round} value={round}>
                  Vòng {round}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="team-filter" className="filter-label">
              Lọc theo đội
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">Tất cả các đội</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-stats">
            <span className="stats-badge">
              {filteredResults.length} kết quả
            </span>
          </div>
        </div>

        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>STT</th>
                <th>Mã trận</th>
                <th style={{ width: "80px" }}>Vòng</th>
                <th>Đội 1</th>
                <th style={{ width: "80px", textAlign: "center" }}>Tỷ số</th>
                <th>Đội 2</th>
                <th>Ngày thi đấu</th>
                <th>Sân</th>
                <th style={{ width: "150px", textAlign: "center" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <p>
                      {selectedRound && selectedTeam
                        ? `Chưa có trận nào thuộc vòng ${selectedRound} của đội được chọn được ghi kết quả.`
                        : selectedRound
                        ? `Chưa có trận nào thuộc vòng ${selectedRound} được ghi kết quả.`
                        : selectedTeam
                        ? "Chưa có trận đấu nào của đội này được ghi kết quả."
                        : "Chưa có kết quả trận đấu nào được ghi nhận."}
                    </p>
                  </td>
                </tr>
              ) : (
                currentResults.map((result, index) => (
                  <tr key={result.id}>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td>
                      <strong>{result.match_code || "—"}</strong>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#007bff",
                      }}
                    >
                      {getMatchRound(result) || "N/A"}
                    </td>
                    <td>
                      <strong>{result.team1_name}</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="score-badge">{result.score}</span>
                    </td>
                    <td>
                      <strong>{result.team2_name}</strong>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(result.match_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{result.stadium}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.3rem",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-info btn-sm"
                          onClick={() => handleView(result.id)}
                          title="Xem chi tiết tratan đấu"
                        >
                          <FaEye />
                        </button>
                        {canEditResults && (
                          <>
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              onClick={() => handleEdit(result.id)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(result.id)}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>

            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`pagination-page ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              className="pagination-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-content-wrapper">
              <div className="modal-header">
                <h2>Sửa kết quả trận đấu</h2>
                <button
                  className="close-modal-btn"
                  onClick={handleCloseEditModal}
                >
                  <FaTimes />
                </button>
              </div>
              <MatchForm
                initialData={editData}
                teams={teams}
                schedules={schedules}
                settings={settings}
                onSubmit={handleUpdate}
                onCancel={handleCloseEditModal}
                isEditing={true}
                token={token}
              />
            </div>
          </div>,
          document.body
        )}

      {/* View Modal */}
      {showViewModal &&
        viewingMatchData &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-content-wrapper match-view-modal-wide">
              <div className="modal-header match-view-header">
                <h2>Chi tiết trận đấu</h2>
                <button
                  className="close-modal-btn"
                  onClick={handleCloseViewModal}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body match-view-body">
                {/* Match Info Block - Stacked Layout */}
                <div className="match-info-block">
                  {/* Row 1: Match Code */}
                  <div className="match-code-row">
                    <span className="match-code-label">Mã trận</span>
                    <span className="match-code-value">
                      {viewingMatchData.match_code || "—"}
                    </span>
                  </div>

                  {/* Row 2: Teams and Score */}
                  <div className="match-teams-row">
                    <div className="team-box team1-box">
                      <span className="team-name-display">
                        {viewingMatchData.team1_name}
                      </span>
                    </div>
                    <div className="score-box">
                      <span className="score-display">
                        {viewingMatchData.score || "0-0"}
                      </span>
                    </div>
                    <div className="team-box team2-box">
                      <span className="team-name-display">
                        {viewingMatchData.team2_name}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Date, Time, Stadium */}
                  <div className="match-details-row">
                    <div className="detail-item">
                      <span className="detail-text">
                        {new Date(
                          viewingMatchData.match_date
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="detail-separator">•</div>
                    <div className="detail-item">
                      <span className="detail-text">
                        {viewingMatchData.match_time || "—"}
                      </span>
                    </div>
                    <div className="detail-separator">•</div>
                    <div className="detail-item">
                      <span className="detail-text">
                        {viewingMatchData.stadium || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Goals Section */}
                <div className="match-view-goals-section">
                  <h3 className="goals-section-title">Danh sách ghi bàn</h3>

                  {viewingMatchGoals.length > 0 ? (
                    <div className="goals-table-wrapper">
                      <div className="goals-table-header">
                        <div className="goals-col goals-col-stt">STT</div>
                        <div className="goals-col goals-col-player">
                          Cầu thủ
                        </div>
                        <div className="goals-col goals-col-team">Đội</div>
                        <div className="goals-col goals-col-type">
                          Loại bàn thắng
                        </div>
                        <div className="goals-col goals-col-time">
                          Thời điểm
                        </div>
                      </div>
                      {viewingMatchGoals.map((goal, index) => {
                        const isTeam1Goal =
                          goal.team_id === viewingMatchData.team1_id;
                        return (
                          <div
                            key={index}
                            className={`goals-table-row ${
                              isTeam1Goal ? "team1-goal" : "team2-goal"
                            }`}
                          >
                            <div className="goals-col goals-col-stt">
                              {index + 1}
                            </div>
                            <div className="goals-col goals-col-player">
                              {goal.player_name || "—"}
                            </div>
                            <div className="goals-col goals-col-team">
                              {isTeam1Goal
                                ? viewingMatchData.team1_name
                                : viewingMatchData.team2_name}
                            </div>
                            <div className="goals-col goals-col-type">
                              <span className="type-badge">
                                {goal.goal_type === "own"
                                  ? "Phản lưới"
                                  : goal.goal_type === "penalty"
                                  ? "11m"
                                  : "Bình thường"}
                              </span>
                            </div>
                            <div className="goals-col goals-col-time">
                              {goal.goal_time || "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-goals-message">
                      <p>Chưa có bàn thắng nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MatchResults;

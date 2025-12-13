import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import "./RecordMatchResult.css";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationModal from "./NotificationModal";
import MatchForm from "./MatchForm";

// Component để sửa chỉ tỉ số và bàn thắng
const EditMatchModal = ({ matchData, teams, settings, onSubmit, onCancel }) => {
  const [score, setScore] = useState(matchData.matchInfo.score || "0-0");
  const [goals, setGoals] = useState(matchData.goals || []);
  const [error, setError] = useState("");

  const team1 = teams.find((t) => String(t.id) === matchData.matchInfo.team1);
  const team2 = teams.find((t) => String(t.id) === matchData.matchInfo.team2);

  const goalTypes = useMemo(() => {
    if (settings?.goal_types && settings.goal_types.length > 0) {
      return settings.goal_types;
    }
    return ["A", "B", "C"];
  }, [settings]);

  const handleScoreChange = (newScore) => {
    setScore(newScore);
    setError("");
  };

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      { player: "", team: "", type: goalTypes[0], time: "" },
    ]);
  };

  const handleGoalChange = (index, field, value) => {
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
  };

  const handleDeleteGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!score || !/^\d+-\d+$/.test(score)) {
      setError("Tỉ số không hợp lệ (định dạng: 1-0)");
      return;
    }

    // Validate goals
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];

      if (!goal.team) {
        setError(`Hãy chọn đội cho bàn thắng ${i + 1}`);
        return;
      }

      if (!goal.player) {
        setError(`Hãy nhập tên cầu thủ cho bàn thắng ${i + 1}`);
        return;
      }

      if (!goal.time) {
        setError(`Hãy nhập thời điểm ghi bàn cho bàn thắng ${i + 1}`);
        return;
      }
    }

    setError("");
    onSubmit({
      matchInfo: {
        ...matchData.matchInfo,
        score: score,
      },
      goals: goals,
    });
  };

  return (
    <div className="modal-body">
      {/* Thông tin trận đấu */}
      <div className="form-section">
        <h3>Thông tin trận đấu</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-group label">Đội 1 (sân nhà)</label>
            <input
              type="text"
              value={team1?.name || ""}
              disabled
              className="form-control"
              style={{ backgroundColor: "#f0f3f7" }}
            />
          </div>
          <div className="form-group">
            <label className="form-group label">Đội 2</label>
            <input
              type="text"
              value={team2?.name || ""}
              disabled
              className="form-control"
              style={{ backgroundColor: "#f0f3f7" }}
            />
          </div>
          <div className="form-group">
            <label className="form-group label">Tỉ số</label>
            <input
              type="text"
              placeholder="1-0"
              value={score}
              onChange={(e) => handleScoreChange(e.target.value)}
              className="form-control"
            />
            {error && (
              <div
                style={{
                  color: "#e74c3c",
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                }}
              >
                {error}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-group label">Ngày</label>
            <input
              type="text"
              value={matchData.matchInfo.date || ""}
              disabled
              className="form-control"
              style={{ backgroundColor: "#f0f3f7" }}
            />
          </div>
          <div className="form-group">
            <label className="form-group label">Giờ</label>
            <input
              type="text"
              value={matchData.matchInfo.time || ""}
              disabled
              className="form-control"
              style={{ backgroundColor: "#f0f3f7" }}
            />
          </div>
        </div>
      </div>

      {/* Sân thi đấu */}
      <div className="form-section">
        <div className="form-grid">
          <div className="form-group stadium-input">
            <label className="form-group label">Sân thi đấu</label>
            <input
              type="text"
              value={matchData.matchInfo.stadium || ""}
              disabled
              className="form-control"
              style={{ backgroundColor: "#f0f3f7" }}
            />
          </div>
        </div>
      </div>

      {/* Danh sách bàn thắng */}
      <div className="form-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ margin: 0 }}>Danh sách bàn thắng</h3>
          <button
            type="button"
            onClick={handleAddGoal}
            className="btn btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <FaPlus /> Thêm bàn thắng
          </button>
        </div>

        {goals.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              background: "#f8f9fb",
              borderRadius: "8px",
              color: "#95a5a6",
            }}
          >
            Chưa có bàn thắng nào
          </div>
        ) : (
          <div className="goals-table-wrapper">
            <table className="goals-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Đội</th>
                  <th>Cầu thủ</th>
                  <th>Loại bàn thắng</th>
                  <th>Thời điểm (phút)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    <td>
                      <select
                        value={goal.team}
                        onChange={(e) =>
                          handleGoalChange(index, "team", e.target.value)
                        }
                        className="form-control"
                      >
                        <option value="">-- Chọn đội --</option>
                        <option value={matchData.matchInfo.team1}>
                          {team1?.name}
                        </option>
                        <option value={matchData.matchInfo.team2}>
                          {team2?.name}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Cầu thủ..."
                        value={goal.player || ""}
                        onChange={(e) =>
                          handleGoalChange(index, "player", e.target.value)
                        }
                        className="form-control"
                      />
                    </td>
                    <td>
                      <select
                        value={goal.type}
                        onChange={(e) =>
                          handleGoalChange(index, "type", e.target.value)
                        }
                        className="form-control"
                      >
                        {goalTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="Phút..."
                        value={goal.time || ""}
                        onChange={(e) =>
                          handleGoalChange(index, "time", e.target.value)
                        }
                        className="form-control"
                        min="0"
                        max="120"
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(index)}
                        className="btn btn-danger"
                        style={{
                          padding: "0.5rem",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nút hành động */}
      <div className="btn-group" style={{ marginTop: "2rem" }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
        >
          Cập nhật
        </button>
      </div>
    </div>
  );
};

const RecordMatchResult = () => {
  const { token, canAccessFeature } = useAuth();
  const navigate = useNavigate();
  const canRecordResults = canAccessFeature("record_match_results");

  const [showModal, setShowModal] = useState(false); // For notifications
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  const [showEditModal, setShowEditModal] = useState(false); // For editing form
  const [editData, setEditData] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [teams, setTeams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState(null);
  const [recordedMatches, setRecordedMatches] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // Filter out schedules that already have results
  const availableSchedules = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];
    if (!recordedMatches || recordedMatches.length === 0) return schedules;

    // Get list of match_codes that already have results
    const recordedMatchCodes = new Set(
      recordedMatches.map((r) => r.match_code).filter(Boolean)
    );

    // Filter out schedules that already have results
    return schedules.filter((s) => !recordedMatchCodes.has(s.match_code));
  }, [schedules, recordedMatches]);

  useEffect(() => {
    if (!token || !canRecordResults) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };

    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        const [teamRes, settingsRes, scheduleRes] = await Promise.all([
          fetch("/api/teams", { headers, signal: controller.signal }),
          fetch("/api/settings", { headers, signal: controller.signal }),
          fetch("/api/schedules", { headers, signal: controller.signal }),
        ]);

        if (!active) return;

        if (!teamRes.ok) throw new Error("Không thể tải danh sách đội bóng.");
        if (!settingsRes.ok)
          throw new Error("Không thể tải quy định bàn thắng.");

        const teamData = await teamRes.json();
        const settingsData = await settingsRes.json();
        const scheduleData = scheduleRes.ok
          ? await scheduleRes.json()
          : { data: [] };

        if (teamData.message === "success") setTeams(teamData.data || []);
        if (settingsData.message === "success")
          setSettings(settingsData.data || null);
        if (
          scheduleData.message === "success" ||
          Array.isArray(scheduleData.data)
        ) {
          setSchedules(scheduleData.data || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu ban đầu.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialData();
    fetchRecordedMatches();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, canRecordResults]);

  const fetchRecordedMatches = async () => {
    if (!token) return;
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/results", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecordedMatches(data.data || []);
        setHistoryPage(1);
      }
    } catch (err) {
      console.error("Failed to fetch match history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreate = async (matchInfo, goals) => {
    await submitMatchResult(matchInfo, goals, null);
  };

  const handleUpdate = async (matchInfo, goals) => {
    await submitMatchResult(matchInfo, goals, editingMatchId);
  };

  const submitMatchResult = async (matchInfo, goals, matchId) => {
    if (!token) return;
    setToast("");
    setError("");

    // Validate match info before normalizing
    if (
      !matchInfo.team1 ||
      !matchInfo.team2 ||
      !matchInfo.score ||
      !matchInfo.date ||
      !matchInfo.time
    ) {
      setModalMessage(
        "Vui lòng điền đầy đủ thông tin trận đấu (Đội 1, Đội 2, Tỉ số, Ngày, Giờ)."
      );
      setModalType("error");
      setShowModal(true);
      return;
    }

    // Normalize data
    const normalizedMatchInfo = {
      ...matchInfo,
      team1: String(matchInfo.team1),
      team2: String(matchInfo.team2),
    };

    const normalizedGoals = goals.map((goal) => ({
      ...goal,
      team: String(goal.team || ""),
      player: String(goal.player || ""),
      time: goal.time !== "" ? Number(goal.time) : "",
    }));

    // Validate goals
    const team1Id = String(normalizedMatchInfo.team1);
    const team2Id = String(normalizedMatchInfo.team2);
    const team1Obj = teams.find((t) => String(t.id) === team1Id);
    const team2Obj = teams.find((t) => String(t.id) === team2Id);

    // Validate score vs goals count
    const scoreParts = normalizedMatchInfo.score.split("-");
    if (scoreParts.length === 2) {
      const scoreTeam1 = parseInt(scoreParts[0].trim(), 10);
      const scoreTeam2 = parseInt(scoreParts[1].trim(), 10);

      if (!isNaN(scoreTeam1) && !isNaN(scoreTeam2)) {
        const goalsTeam1 = normalizedGoals.filter(
          (g) => String(g.team) === team1Id
        ).length;
        const goalsTeam2 = normalizedGoals.filter(
          (g) => String(g.team) === team2Id
        ).length;

        if (goalsTeam1 !== scoreTeam1 || goalsTeam2 !== scoreTeam2) {
          setToast(
            `Không thể ghi nhận kết quả: Số bàn thắng không khớp với tỷ số (Đội 1: ${goalsTeam1}/${scoreTeam1}, Đội 2: ${goalsTeam2}/${scoreTeam2}).`
          );
          return;
        }
      }
    }

    for (let i = 0; i < normalizedGoals.length; i++) {
      const goal = normalizedGoals[i];

      // Check if goal has required fields
      if (!goal.team) {
        setModalMessage("Hãy chọn đội cho tất cả bàn thắng.");
        setModalType("error");
        setShowModal(true);
        return;
      }

      if (!goal.player) {
        setModalMessage(`Hãy nhập tên cầu thủ cho bàn thắng ${i + 1}.`);
        setModalType("error");
        setShowModal(true);
        return;
      }

      if (!goal.time) {
        setModalMessage(`Hãy nhập thời điểm ghi bàn cho bàn thắng ${i + 1}.`);
        setModalType("error");
        setShowModal(true);
        return;
      }

      // Validate that the player belongs to the scoring team
      const scoringTeamId = String(goal.team);
      const scoringTeam = scoringTeamId === team1Id ? team1Obj : team2Obj;

      if (!scoringTeam) {
        setModalMessage(`Đội ghi bàn ${i + 1} không hợp lệ.`);
        setModalType("error");
        setShowModal(true);
        return;
      }

      // Note: We're not strictly validating player existence since player names can be typed in
      // But we can validate that the player is being assigned to the correct team
      // If you want stricter validation with a player database, implement that here
    }

    try {
      const url = matchId ? `/api/results/${matchId}` : "/api/results";
      const method = matchId ? "PUT" : "POST";

      const payload = {
        matchInfo: normalizedMatchInfo,
        goals: normalizedGoals,
      };

      console.log("Submitting match result:", {
        url,
        method,
        payload,
        matchInfoKeys: Object.keys(normalizedMatchInfo),
        goalsCount: normalizedGoals.length,
      });

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Response:", { status: response.status, data });

      if (response.ok) {
        setModalMessage(
          matchId
            ? "Cập nhật kết quả thành công!"
            : "Kết quả trận đấu đã được lưu thành công!"
        );
        setModalType("success");
        setShowModal(true);
        setToast(matchId ? "Đã cập nhật kết quả." : "Đã lưu kết quả trận đấu.");

        // Refresh history
        fetchRecordedMatches();

        // Close edit modal if open
        if (matchId) {
          setShowEditModal(false);
          setEditingMatchId(null);
          setEditData(null);
        }

        // If creating, the form resets automatically via key or we can force it?
        // MatchForm resets when initialData changes.
        // For create, we might want to clear the form.
        // We can achieve this by passing a key that changes, or just letting the user reset.
        // Actually, MatchForm doesn't expose a reset method.
        // We can force re-mount by changing a key on the Create form.
        // Or we can just let it be.
        // Ideally, we want to clear the form after success.
        // I'll add a key to the create form.
      } else {
        const errorMsg =
          data.error || data.message || "Đã xảy ra lỗi khi lưu kết quả.";
        setModalMessage(errorMsg);
        setModalType("error");
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error submitting match result:", error);
      setModalMessage("Đã xảy ra lỗi mạng hoặc máy chủ.");
      setModalType("error");
      setShowModal(true);
    }
  };

  const handleEditMatch = async (matchId) => {
    const matchToEdit = recordedMatches.find((m) => m.id === matchId);
    if (!matchToEdit) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/results/${matchId}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch match details");

      const data = await response.json();
      const matchGoals = data.data || [];

      const preparedData = {
        matchInfo: {
          matchId: "", // Reset match selection
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
          time: String(g.goal_time || ""),
          // goalCode được tự sinh từ backend - không cần gửi
        })),
      };

      setEditData(preparedData);
      setEditingMatchId(matchId);
      setShowEditModal(true);
      setLoading(false);
    } catch (err) {
      console.error("Error preparing edit:", err);
      setModalMessage("Không thể tải thông tin trận đấu để sửa.");
      setModalType("error");
      setShowModal(true);
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa trận đấu này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/results/${matchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setToast("Đã xóa trận đấu thành công!");
        fetchRecordedMatches();
      } else {
        const data = await response.json();
        setModalMessage(data.error || "Không thể xóa trận đấu.");
        setModalType("error");
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage("Đã xảy ra lỗi khi xóa trận đấu.");
      setModalType("error");
      setShowModal(true);
    }
  };

  const handleCloseNotification = () => {
    setShowModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingMatchId(null);
    setEditData(null);
  };

  if (!token)
    return <div className="record-match-container">Login required</div>;
  if (!canRecordResults)
    return <div className="record-match-container">Access denied</div>;

  return (
    <div className="record-match-container">
      <div className="record-match-header">
        <h2>Ghi nhận kết quả</h2>
        <p>Cập nhật tỷ số, danh sách bàn thắng và thông tin trận đấu.</p>
      </div>

      {error && (
        <div className="admin-alert" onClick={() => setError("")}>
          {error}
        </div>
      )}
      {toast && (
        <div
          className="admin-toast"
          onClick={() => setToast("")}
          style={{
            backgroundColor:
              toast.startsWith("Không thể") || toast.startsWith("Lỗi")
                ? "#ef4444"
                : "#10b981",
          }}
        >
          {toast}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8 mb-3 mb-lg-0">
          {/* Create Form */}
          <MatchForm
            key={toast} // Hack to reset form on success (toast changes)
            teams={teams}
            schedules={availableSchedules}
            settings={settings}
            onSubmit={handleCreate}
            token={token}
          />
        </div>

        <div className="col-lg-4">
          <div className="record-match-card h-100">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                borderBottom: "3px solid #4a90e2",
                paddingBottom: "1rem",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "#1a2332",
                }}
              >
                Trận đấu gần đây
              </h3>
              <button
                onClick={() => navigate("/match-results")}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Xem tất cả
              </button>
            </div>
            {historyLoading ? (
              <p className="text-muted text-center py-4">Đang tải lịch sử...</p>
            ) : recordedMatches.length === 0 ? (
              <p className="text-muted text-center py-4">
                Chưa có trận đấu nào.
              </p>
            ) : (
              <>
                <div className="match-history-list">
                  {recordedMatches
                    .slice(
                      (historyPage - 1) * itemsPerPage,
                      historyPage * itemsPerPage
                    )
                    .map((match) => (
                      <div key={match.id} className="match-history-item">
                        <div className="match-history-content">
                          <div className="match-history-teams">
                            <span
                              className="team-name"
                              title={match.team1_name}
                            >
                              {match.team1_name}
                            </span>
                            <span className="match-score">
                              {match.score || "vs"}
                            </span>
                            <span
                              className="team-name"
                              title={match.team2_name}
                            >
                              {match.team2_name}
                            </span>
                          </div>
                          <div className="match-history-meta">
                            <span className="match-meta-item">
                              📅{" "}
                              {new Date(match.match_date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                            <span className="match-separator">•</span>
                            <span className="match-meta-item">
                              🕐 {match.match_time || "N/A"}
                            </span>
                            <span className="match-separator">•</span>
                            <span className="match-meta-item">
                              📍 {match.stadium}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                {Math.ceil(recordedMatches.length / itemsPerPage) > 1 && (
                  <div className="history-pagination">
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setHistoryPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={historyPage === 1}
                    >
                      &lt;
                    </button>

                    <div className="pagination-pages">
                      {Array.from(
                        {
                          length: Math.ceil(
                            recordedMatches.length / itemsPerPage
                          ),
                        },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          className={`pagination-page ${
                            historyPage === page ? "active" : ""
                          }`}
                          onClick={() => setHistoryPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setHistoryPage((prev) =>
                          Math.min(
                            prev + 1,
                            Math.ceil(recordedMatches.length / itemsPerPage)
                          )
                        )
                      }
                      disabled={
                        historyPage ===
                        Math.ceil(recordedMatches.length / itemsPerPage)
                      }
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal &&
        createPortal(
          <div className="modal-overlay" onClick={handleCloseEditModal}>
            <div
              className="modal-content-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Sửa kết quả trận đấu</h2>
                <button
                  className="close-modal-btn"
                  onClick={handleCloseEditModal}
                >
                  <FaTimes />
                </button>
              </div>
              {editData && (
                <EditMatchModal
                  matchData={editData}
                  teams={teams}
                  settings={settings}
                  onSubmit={(updatedData) => {
                    handleUpdate(updatedData.matchInfo, updatedData.goals);
                  }}
                  onCancel={handleCloseEditModal}
                />
              )}
            </div>
          </div>,
          document.body
        )}

      <NotificationModal
        isOpen={showModal}
        message={modalMessage}
        type={modalType}
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default RecordMatchResult;

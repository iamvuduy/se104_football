import React, { useEffect, useState, useMemo } from "react";
import "./RecordMatchResult.css";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import NotificationModal from "./NotificationModal";
import MatchForm from "./MatchForm";

const RecordMatchResult = () => {
  const { token, canAccessFeature } = useAuth();
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

  // Filter out schedules that already have results
  const availableSchedules = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];
    if (!recordedMatches || recordedMatches.length === 0) return schedules;
    
    // Get list of match_codes that already have results
    const recordedMatchCodes = new Set(
      recordedMatches.map(r => r.match_code).filter(Boolean)
    );
    
    // Filter out schedules that already have results
    return schedules.filter(s => !recordedMatchCodes.has(s.match_code));
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
        if (!settingsRes.ok) throw new Error("Không thể tải quy định bàn thắng.");

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
        setRecordedMatches((data.data || []).slice(0, 5));
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

    // Normalize data
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
      const url = matchId ? `/api/results/${matchId}` : "/api/results";
      const method = matchId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchInfo: normalizedMatchInfo,
          goals: normalizedGoals,
        }),
      });

      const data = await response.json();

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
          time: g.goal_time,
          goalCode: g.goal_code,
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

  if (!token) return <div className="record-match-container">Login required</div>;
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
        <div className="admin-toast" onClick={() => setToast("")}>
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
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                borderBottom: "3px solid #4a90e2",
                paddingBottom: "1rem",
                color: "#1a2332",
              }}
            >
              Trận đấu gần đây
            </h3>
            {historyLoading ? (
              <p className="text-muted text-center py-4">Đang tải lịch sử...</p>
            ) : recordedMatches.length === 0 ? (
              <p className="text-muted text-center py-4">
                Chưa có trận đấu nào.
              </p>
            ) : (
              <div className="match-history-list">
                {recordedMatches.map((match) => (
                  <div key={match.id} className="match-history-item">
                    <div className="match-history-content">
                      <div className="match-history-teams">
                        <span className="team-name">{match.team1_name}</span>
                        <span className="match-score">{match.score}</span>
                        <span className="team-name">{match.team2_name}</span>
                      </div>
                      <div className="match-history-meta">
                        <span className="match-date">
                          {new Date(match.match_date).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                        <span className="match-separator">•</span>
                        <span className="match-stadium">{match.stadium}</span>
                      </div>
                    </div>
                    <div className="match-history-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditMatch(match.id)}
                        title="Sửa"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteMatch(match.id)}
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
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
              schedules={availableSchedules}
              settings={settings}
              onSubmit={handleUpdate}
              onCancel={handleCloseEditModal}
              isEditing={true}
              token={token}
            />
          </div>
        </div>
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

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./ScheduleManagement.css";
import { useAuth } from "../context/AuthContext";
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaUsers,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const EditScheduleModal = ({ schedule, onClose, onUpdate }) => {
  const [date, setDate] = useState(schedule.date);
  const [time, setTime] = useState(schedule.time);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date || !time) {
      setError("Vui lòng nhập đầy đủ ngày và giờ.");
      return;
    }
    onUpdate({ ...schedule, date, time });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Chỉnh sửa lịch thi đấu</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <h3 className="section-title">Thông tin trận đấu</h3>

          <div className="info-grid">
            <div className="form-group">
              <label className="form-label">Đội 1</label>
              <input
                type="text"
                value={schedule.team1_name || schedule.team1_code}
                disabled
                className="form-control read-only"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Đội 2</label>
              <input
                type="text"
                value={schedule.team2_name || schedule.team2_code}
                disabled
                className="form-control read-only"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vòng đấu</label>
              <input
                type="text"
                value={schedule.round}
                disabled
                className="form-control read-only"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày thi đấu</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Giờ thi đấu</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="form-control"
                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                placeholder="HH:MM"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Sân thi đấu</label>
              <input
                type="text"
                value={schedule.stadium}
                disabled
                className="form-control read-only"
              />
            </div>
          </div>
          {error && <div className="text-danger mt-2">{error}</div>}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-sm"
          >
            Cập nhật
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduleManagement = () => {
  const { token, canAccessFeature } = useAuth();
  const canManageSchedules = canAccessFeature("manage_schedules");
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([
    { round: "", team1_id: "", team2_id: "", date: "", time: "", stadium: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const endOfMatchesRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Filters for upcoming schedules
  const [filterRound, setFilterRound] = useState("");
  const [filterTeam1, setFilterTeam1] = useState("");
  const [filterTeam2, setFilterTeam2] = useState("");

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const axiosConfig = useMemo(() => {
    if (!token || !canManageSchedules) {
      return null;
    }
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, [token, canManageSchedules]);

  const loadData = useCallback(async () => {
    if (!axiosConfig) {
      return;
    }
    setLoading(true);
    setError("");
    setToast(null);

    try {
      const [scheduleResult, teamResult] = await Promise.allSettled([
        axios.get("/api/schedules", axiosConfig),
        axios.get("/api/teams", axiosConfig),
      ]);

      if (scheduleResult.status === "fulfilled") {
        setSchedules(scheduleResult.value.data?.data || []);
      } else {
        console.error("Không thể tải lịch thi đấu:", scheduleResult.reason);
        setSchedules([]);
      }

      if (teamResult.status === "fulfilled") {
        setTeams(teamResult.value.data?.data || []);
      } else {
        console.error("Không thể tải danh sách đội:", teamResult.reason);
        setTeams([]);
      }

      const failedResources = [];
      if (scheduleResult.status === "rejected") {
        failedResources.push("lịch thi đấu");
      }
      if (teamResult.status === "rejected") {
        failedResources.push("danh sách đội");
      }

      if (failedResources.length) {
        setError(
          `Không thể tải ${failedResources.join(" và ")}. Vui lòng thử lại.`
        );
      }
    } catch (err) {
      console.error("Lỗi không xác định khi tải dữ liệu lịch:", err);
      setError("Hệ thống gặp sự cố khi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  useEffect(() => {
    if (!axiosConfig || !canManageSchedules) {
      setLoading(false);
      return;
    }
    loadData();
  }, [axiosConfig, loadData, canManageSchedules]);

  const handleMatchChange = (index, field, value) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };

    // Auto-fill stadium based on team1_id
    if (field === "team1_id" && value) {
      const selectedTeam = teams.find((team) => team.id === parseInt(value));
      if (selectedTeam) {
        newMatches[index].stadium = selectedTeam.home_stadium;
      }
    }

    setMatches(newMatches);
  };

  const handleAddMatch = () => {
    setMatches([
      ...matches,
      {
        round: "",
        team1_id: "",
        team2_id: "",
        date: "",
        time: "",
        stadium: "",
      },
    ]);
    setTimeout(() => {
      endOfMatchesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleRemoveMatch = (index) => {
    setMatches(matches.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!axiosConfig) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await axios.post("/api/schedules/batch", { matches }, axiosConfig);
      await loadData();
      setMatches([
        {
          round: "",
          team1_id: "",
          team2_id: "",
          date: "",
          time: "",
          stadium: "",
        },
      ]);
      setCurrentPage(1);
      setToast({
        message: `Đã tạo ${matches.length} lịch thi đấu mới.`,
        type: "success",
      });
    } catch (err) {
      console.error("Lỗi khi lưu lịch thi đấu:", err);
      setToast({
        message:
          err.response?.data?.error || "Có lỗi xảy ra khi lưu lịch thi đấu.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch thi đấu này?")) return;

    try {
      await axios.delete(`/api/schedules/${id}`, axiosConfig);
      setToast({ message: "Xóa lịch thi đấu thành công!", type: "success" });
      loadData();
    } catch (err) {
      console.error("Lỗi khi xóa lịch thi đấu:", err);
      setToast({
        message:
          err.response?.data?.error || "Có lỗi xảy ra khi xóa lịch thi đấu.",
        type: "error",
      });
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  const handleUpdateSchedule = async (updatedSchedule) => {
    try {
      await axios.put(
        `/api/schedules/${updatedSchedule.id}`,
        updatedSchedule,
        axiosConfig
      );
      setToast({
        message: "Cập nhật lịch thi đấu thành công!",
        type: "success",
      });
      setShowEditModal(false);
      setEditingSchedule(null);
      loadData();
    } catch (err) {
      console.error("Lỗi khi cập nhật lịch thi đấu:", err);
      setToast({
        message:
          err.response?.data?.error ||
          "Có lỗi xảy ra khi cập nhật lịch thi đấu.",
        type: "error",
      });
    }
  };

  // Pagination with filters
  const filteredSchedules = useMemo(() => {
    let filtered = [...schedules];

    // Filter by round
    if (filterRound) {
      filtered = filtered.filter((schedule) => {
        const scheduleRound = schedule.round?.toString().toLowerCase() || "";
        const filterValue = filterRound.toLowerCase();
        return (
          scheduleRound.includes(filterValue) || scheduleRound === filterValue
        );
      });
    }

    // Filter by team 1
    if (filterTeam1) {
      filtered = filtered.filter((schedule) => {
        return schedule.team1_id === parseInt(filterTeam1);
      });
    }

    // Filter by team 2
    if (filterTeam2) {
      filtered = filtered.filter((schedule) => {
        return schedule.team2_id === parseInt(filterTeam2);
      });
    }

    return filtered;
  }, [schedules, filterRound, filterTeam1, filterTeam2]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const currentSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRound, filterTeam1, filterTeam2]);

  // Get unique rounds for filter dropdown
  const availableRounds = useMemo(() => {
    const rounds = [...new Set(schedules.map((s) => s.round).filter(Boolean))];
    return rounds.sort();
  }, [schedules]);

  if (!token) {
    return (
      <div className="schedule-management-container">
        <div className="schedule-card">
          <h2>
            <FaCalendarAlt /> Yêu cầu đăng nhập
          </h2>
          <p>Bạn cần đăng nhập để truy cập chức năng này.</p>
        </div>
      </div>
    );
  }

  if (!canManageSchedules) {
    return (
      <div className="schedule-management-container">
        <div className="schedule-card">
          <h2>
            <FaCalendarAlt /> Quyền hạn hạn chế
          </h2>
          <p>
            Bạn không có quyền lập lịch thi đấu. Liên hệ ban điều hành để được
            cấp quyền.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="schedule-management-container">
        <div className="loading-container">
          <p className="loading-text">Đang tải lịch thi đấu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-management-container">
      <div className="schedule-header">
        <h2>Lập lịch thi đấu</h2>
        <p>Thiết lập và quản lý khung giờ thi đấu cho toàn bộ giải đấu</p>
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

      <div className="row">
        <div className="col-lg-8 mb-3 mb-lg-0">
          <form onSubmit={handleSubmit}>
            <div className="schedule-card">
              <div className="form-section">
                <h3 className="mt-0 mb-3">
                  <FaCalendarAlt /> Tạo lịch thi đấu
                </h3>

                <div className="table-responsive">
                  <table
                    className="table schedule-table"
                    style={{ marginBottom: 0 }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: "5%" }}>STT</th>
                        <th style={{ width: "15%" }}>Vòng Thi Đấu</th>
                        <th style={{ width: "20%" }}>Đội 1</th>
                        <th style={{ width: "20%" }}>Đội 2</th>
                        <th style={{ width: "12%" }}>Ngày</th>
                        <th style={{ width: "8%" }}>Giờ</th>
                        <th style={{ width: "15%" }}>Sân</th>
                        <th style={{ width: "5%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((match, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={match.round}
                              onChange={(e) =>
                                handleMatchChange(
                                  index,
                                  "round",
                                  e.target.value
                                )
                              }
                              placeholder="VD: Vòng 1"
                              required
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={match.team1_id}
                              onChange={(e) =>
                                handleMatchChange(
                                  index,
                                  "team1_id",
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="">Chọn đội 1</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  [{team.team_code}] {team.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={match.team2_id}
                              onChange={(e) =>
                                handleMatchChange(
                                  index,
                                  "team2_id",
                                  e.target.value
                                )
                              }
                              disabled={!match.team1_id}
                              required
                            >
                              <option value="">Chọn đội 2</option>
                              {teams.map((team) => (
                                <option
                                  key={team.id}
                                  value={team.id}
                                  disabled={
                                    String(team.id) === String(match.team1_id)
                                  }
                                >
                                  [{team.team_code}] {team.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={match.date}
                              onChange={(e) =>
                                handleMatchChange(index, "date", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={match.time}
                              onChange={(e) =>
                                handleMatchChange(index, "time", e.target.value)
                              }
                              placeholder="VD: 14:30"
                              pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                              title="Nhập giờ theo định dạng 24 giờ"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={match.stadium}
                              onChange={(e) =>
                                handleMatchChange(
                                  index,
                                  "stadium",
                                  e.target.value
                                )
                              }
                              placeholder="Sân nhà đội 1"
                              readOnly
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMatch(index)}
                              disabled={matches.length === 1}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: 0 }} colSpan="8">
                          <div ref={endOfMatchesRef} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddMatch}
                  >
                    <FaPlus /> Thêm trận
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={saving}
                  >
                    <FaCheckCircle /> Lưu {matches.length} trận đấu
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="col-lg-4">
          <div className="schedule-card">
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              <FaCalendarAlt /> Lịch sắp diễn ra
            </h3>

            {/* Filter controls */}
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-end",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Vòng:
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filterRound}
                    onChange={(e) => setFilterRound(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {availableRounds.map((round) => (
                      <option key={round} value={round}>
                        {round}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Đội 1:
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filterTeam1}
                    onChange={(e) => setFilterTeam1(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Đội 2:
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filterTeam2}
                    onChange={(e) => setFilterTeam2(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(filterRound || filterTeam1 || filterTeam2) && (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setFilterRound("");
                      setFilterTeam1("");
                      setFilterTeam2("");
                    }}
                    title="Xóa bộ lọc"
                    style={{ flexShrink: 0 }}
                  >
                    <FaSyncAlt />
                  </button>
                )}
              </div>
            </div>

            {filteredSchedules.length === 0 ? (
              <p style={{ color: "#666", textAlign: "center" }}>
                {schedules.length === 0
                  ? "Chưa có lịch thi đấu."
                  : "Không tìm thấy trận đấu phù hợp."}
              </p>
            ) : (
              <>
                <div>
                  {currentSchedules.map((schedule) => (
                    <div key={schedule.id} className="upcoming-match-card">
                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(schedule)}
                          title="Sửa trận đấu"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(schedule.id)}
                          title="Xóa trận đấu"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="match-teams">
                        <span className="team-name" title={schedule.team1_name}>
                          {schedule.team1_name || schedule.team1_code}
                        </span>
                        <div className="d-flex flex-column align-items-center">
                          <span className="vs-badge">VS</span>
                          {schedule.round && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                marginTop: "0.25rem",
                                fontWeight: "normal",
                                opacity: 0.9,
                              }}
                            >
                              {schedule.round
                                .toString()
                                .toLowerCase()
                                .startsWith("vòng")
                                ? schedule.round
                                : `Vòng ${schedule.round}`}
                            </span>
                          )}
                        </div>
                        <span
                          className="team-name right"
                          title={schedule.team2_name}
                        >
                          {schedule.team2_name || schedule.team2_code}
                        </span>
                      </div>

                      {schedule.match_code && (
                        <div className="match-code-display">
                          {schedule.match_code}
                        </div>
                      )}

                      <div className="match-info-row">
                        <div className="match-info-item">
                          <FaCalendarAlt /> {schedule.date}
                        </div>
                        <div className="match-info-item">
                          <FaClock /> {schedule.time}
                        </div>
                        <div className="match-info-item">
                          <FaMapMarkerAlt /> {schedule.stadium}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      style={{ margin: "0.25rem" }}
                    >
                      <FaChevronLeft />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`btn btn-sm ${
                            currentPage === page
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setCurrentPage(page)}
                          style={{ margin: "0.25rem" }}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      style={{ margin: "0.25rem" }}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {showEditModal && editingSchedule && (
        <EditScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowEditModal(false);
            setEditingSchedule(null);
          }}
          onSave={handleUpdateSchedule}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;

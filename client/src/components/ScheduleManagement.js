import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "react-icons/fa";

// Helper to ensure 24-hour format
const formatTime24h = (timeStr) => {
  if (!timeStr) return "";
  // If already in HH:MM format, return as is
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  // If in 12h format with AM/PM, convert
  try {
    const date = new Date(`2000-01-01 ${timeStr}`);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return timeStr;
  }
};


const ScheduleManagement = () => {
  const { token, canAccessFeature } = useAuth();
  const canManageSchedules = canAccessFeature("manage_schedules");
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    matchId: "",
    round: "",
    team1_id: "",
    team2_id: "",
    date: "",
    time: "",
    stadium: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    if (name === "team1_id") {
      if (value) {
        const selectedTeam = teams.find((team) => team.id === parseInt(value));
        if (selectedTeam) {
          newForm.stadium = selectedTeam.home_stadium;
        }
      } else {
        newForm.stadium = "";
      }
    }

    setForm(newForm);
  };

  const resetForm = () => {
    setForm({
      matchId: "",
      round: "",
      team1_id: "",
      team2_id: "",
      date: "",
      time: "",
      stadium: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!axiosConfig) {
      return;
    }

    setSaving(true);
    setError("");
    const url = editingId ? `/api/schedules/${editingId}` : "/api/schedules";
    const method = editingId ? "put" : "post";

    try {
      await axios[method](url, form, axiosConfig);
      await loadData();
      resetForm();
      setToast({
        message: editingId ? "Đã cập nhật lịch thi đấu." : "Đã tạo lịch thi đấu mới.",
        type: "success"
      });
    } catch (err) {
      console.error("Lỗi khi lưu lịch thi đấu:", err);
      setToast({
        message: err.response?.data?.error || "Có lỗi xảy ra khi lưu lịch thi đấu.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setForm({
      matchId: schedule.match_code,
      round: schedule.round,
      team1_id: schedule.team1_id,
      team2_id: schedule.team2_id,
      date: schedule.date,
      time: schedule.time,
      stadium: schedule.stadium,
    });
    setError("");
    setToast(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        message: err.response?.data?.error || "Có lỗi xảy ra khi xóa lịch thi đấu.",
        type: "error",
      });
    }
  };

  // Pagination for sidebar
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const currentSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return schedules.slice(start, start + itemsPerPage);
  }, [schedules, currentPage]);

  // Pagination for Main Table
  const [tablePage, setTablePage] = useState(1);
  const itemsPerTablePage = 5;

  const totalTablePages = Math.ceil(schedules.length / itemsPerTablePage);
  const currentTableSchedules = useMemo(() => {
    const start = (tablePage - 1) * itemsPerTablePage;
    return schedules.slice(start, start + itemsPerTablePage);
  }, [schedules, tablePage]);

  if (!token) {
    return (
      <div className="schedule-management-container">
        <div className="schedule-card">
          <h2><FaCalendarAlt /> Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để truy cập chức năng này.</p>
        </div>
      </div>
    );
  }

  if (!canManageSchedules) {
    return (
      <div className="schedule-management-container">
        <div className="schedule-card">
          <h2><FaCalendarAlt /> Quyền hạn hạn chế</h2>
          <p>Bạn không có quyền lập lịch thi đấu. Liên hệ ban điều hành để được cấp quyền.</p>
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
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
          {toast.message}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8 mb-3 mb-lg-0">
          <form onSubmit={handleSubmit}>
            <div className="schedule-card">
              <div className="form-section">
                <h3><FaCalendarAlt /> {editingId ? "Chỉnh sửa lịch đấu" : "Tạo lịch thi đấu"}</h3>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label htmlFor="matchId" className="form-label">ID Trận</label>
                    <input
                      id="matchId"
                      name="matchId"
                      className="form-control"
                      value={form.matchId}
                      onChange={handleChange}
                      placeholder="VD: MATCH001"
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="round" className="form-label">Vòng thi đấu</label>
                    <input
                      id="round"
                      name="round"
                      className="form-control"
                      value={form.round}
                      onChange={handleChange}
                      placeholder="VD: Vòng 1"
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="date" className="form-label">Ngày</label>
                    <input
                      id="date"
                      name="date"
                      className="form-control"
                      value={form.date}
                      onChange={handleChange}
                      type="date"
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="time" className="form-label">Giờ</label>
                    <input
                      id="time"
                      name="time"
                      className="form-control"
                      value={form.time}
                      onChange={handleChange}
                      type="text"
                      pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                      placeholder="VD: 01:00"
                      title="Nhập giờ theo định dạng 24 giờ (VD: 14:30)"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="team1_id" className="form-label">Đội 1 (sân nhà)</label>
                    <select
                      id="team1_id"
                      name="team1_id"
                      className="form-control"
                      value={form.team1_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Chọn đội 1</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          [{team.team_code}] {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="team2_id" className="form-label">Đội 2 (khách)</label>
                    <select
                      id="team2_id"
                      name="team2_id"
                      className="form-control"
                      value={form.team2_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Chọn đội 2</option>
                      {teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                          disabled={String(team.id) === String(form.team1_id)}
                        >
                          [{team.team_code}] {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label htmlFor="stadium" className="form-label">Sân thi đấu</label>
                    <input
                      id="stadium"
                      name="stadium"
                      className="form-control"
                      value={form.stadium}
                      onChange={handleChange}
                      placeholder="Tự động điền theo đội 1"
                      readOnly
                      required
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    <FaPlus /> {editingId ? "Cập nhật" : "Thêm lịch"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="schedule-card" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f0f3f7', color: '#1a2332' }}>
              <FaCalendarAlt /> Danh sách lịch thi đấu
            </h3>
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>STT</th>
                    <th>Mã</th>
                    <th>Vòng</th>
                    <th>Đội 1</th>
                    <th>Đội 2</th>
                    <th>Ngày giờ</th>
                    <th>Sân</th>
                    <th style={{ width: "150px", textAlign: "center" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        <p>Chưa có lịch thi đấu nào được tạo.</p>
                      </td>
                    </tr>
                  ) : (
                    currentTableSchedules.map((schedule, index) => (
                      <tr key={schedule.id}>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                          {(tablePage - 1) * itemsPerTablePage + index + 1}
                        </td>
                        <td><strong>{schedule.match_code}</strong></td>
                        <td>{schedule.round}</td>
                        <td>
                          {schedule.team1_code ? `[${schedule.team1_code}] ` : ""}
                          {schedule.team1_name}
                        </td>
                        <td>
                          {schedule.team2_code ? `[${schedule.team2_code}] ` : ""}
                          {schedule.team2_name}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {new Date(schedule.date).toLocaleDateString("vi-VN")} {formatTime24h(schedule.time)}
                        </td>
                        <td>{schedule.stadium}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(schedule)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            {totalTablePages > 1 && (
              <div className="pagination-container">
                <button 
                  className="pagination-btn" 
                  onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
                  disabled={tablePage === 1}
                >
                  &lt;
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalTablePages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`pagination-page ${tablePage === page ? 'active' : ''}`}
                      onClick={() => setTablePage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button 
                  className="pagination-btn" 
                  onClick={() => setTablePage(prev => Math.min(prev + 1, totalTablePages))}
                  disabled={tablePage === totalTablePages}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="schedule-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '3px solid #4a90e2', paddingBottom: '1rem', color: '#1a2332' }}>
              Lịch sắp diễn ra
            </h3>
            {schedules.length === 0 ? (
              <p className="text-muted text-center py-4">Chưa có lịch thi đấu nào.</p>
            ) : (
              <>
                <div className="recent-schedules-list">
                  {currentSchedules.map((schedule) => (
                    <div key={schedule.id} className="recent-schedule-item">
                      <div className="schedule-item-content">
                        <div className="schedule-item-teams">
                          <span>{schedule.team1_name}</span>
                          <span className="schedule-vs">VS</span>
                          <span>{schedule.team2_name}</span>
                        </div>
                        <div className="schedule-item-meta">
                          <span className="schedule-meta-item">
                            <FaCalendarAlt /> {new Date(schedule.date).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="meta-separator">•</span>
                          <span className="schedule-meta-item">
                            <FaClock /> {formatTime24h(schedule.time)}
                          </span>
                          <span className="meta-separator">•</span>
                          <span className="schedule-meta-item">
                            <FaMapMarkerAlt /> {schedule.stadium?.substring(0, 20)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                    
                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
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
    </div>
  );
};

export default ScheduleManagement;

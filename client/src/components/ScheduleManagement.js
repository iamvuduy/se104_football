import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./AdminPanels.css";
import { useAuth } from "../context/AuthContext";
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
} from "react-icons/fa";

const ScheduleManagement = () => {
  const { token, canAccessFeature } = useAuth();
  const canManageSchedules = canAccessFeature("manage_schedules");
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    round: "",
    matchOrder: "",
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
  const [toast, setToast] = useState("");

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
    setToast("");

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
        newForm.stadium = ""; // Reset stadium if no team is selected
      }
    }

    setForm(newForm);
  };

  const resetForm = () => {
    setForm({
      round: "",
      matchOrder: "",
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
    setToast("");
    const url = editingId ? `/api/schedules/${editingId}` : "/api/schedules";
    const method = editingId ? "put" : "post";

    try {
      await axios[method](url, form, axiosConfig);
      await loadData();
      resetForm();
      setToast(
        editingId ? "Đã cập nhật lịch thi đấu." : "Đã tạo lịch thi đấu mới."
      );
    } catch (error) {
      setError(
        editingId
          ? "Không thể cập nhật lịch thi đấu. Vui lòng thử lại."
          : "Không thể tạo lịch thi đấu mới. Vui lòng thử lại."
      );
    }
    setSaving(false);
  };

  const handleEdit = (schedule) => {
    setForm({
      round: schedule.round,
      matchOrder: schedule.matchOrder,
      team1_id: String(schedule.team1_id),
      team2_id: String(schedule.team2_id),
      date: new Date(schedule.date).toISOString().split("T")[0],
      time: schedule.time,
      stadium: schedule.stadium,
    });
    setEditingId(schedule.id);
  };

  const handleDelete = async (id) => {
    if (!axiosConfig) {
      return;
    }
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await axios.delete(`/api/schedules/${id}`, axiosConfig);
        await loadData();
        setToast("Đã xóa lịch thi đấu.");
      } catch (error) {
        setError("Không thể xóa lịch thi đấu lúc này.");
      }
    }
  };

  const selectedTeam1 = useMemo(
    () => teams.find((team) => team.id === Number(form.team1_id)),
    [teams, form.team1_id]
  );
  const selectedTeam2 = useMemo(
    () => teams.find((team) => team.id === Number(form.team2_id)),
    [teams, form.team2_id]
  );
  const matchCodePreview =
    selectedTeam1 && selectedTeam2
      ? `${selectedTeam1.team_code}_${selectedTeam2.team_code}`
      : "-- --";

  const matchCount = useMemo(() => schedules.length, [schedules]);
  const roundCount = useMemo(
    () => new Set(schedules.map((schedule) => schedule.round)).size,
    [schedules]
  );

  const upcomingMatch = useMemo(() => {
    const now = new Date();
    const upcoming = schedules
      .map((schedule) => {
        const timeFragment = schedule.time ? `${schedule.time}` : "00:00";
        const composed = new Date(`${schedule.date}T${timeFragment}`);
        return {
          schedule,
          when: composed,
        };
      })
      .filter(
        ({ when }) =>
          when instanceof Date && !Number.isNaN(when.getTime()) && when >= now
      )
      .sort((a, b) => a.when - b.when);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [schedules]);

  if (!token) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Yêu cầu đăng nhập</span>
              <h1>Lập lịch thi đấu</h1>
              <p>Bạn cần đăng nhập để truy cập chức năng này.</p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (!canManageSchedules) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Quyền hạn hạn chế</span>
              <h1>Lập lịch thi đấu</h1>
              <p>
                Bạn không có quyền lập lịch thi đấu. Liên hệ ban điều hành để
                được cấp quyền.
              </p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Đang tải</span>
              <h1>Lập lịch thi đấu</h1>
              <p>Hệ thống đang đồng bộ dữ liệu lịch và đội bóng.</p>
            </div>
          </header>
          <div className="admin-loading">Đang tải lịch thi đấu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-wrapper">
        <header className="admin-hero">
          <div>
            <span className="admin-hero-badge">Điều phối trận đấu</span>
            <h1>Lập lịch thi đấu</h1>
            <p>Thiết lập và quản lý khung giờ thi đấu cho toàn bộ giải đấu.</p>
          </div>
          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-btn is-ghost"
              onClick={loadData}
            >
              <FaSyncAlt /> Làm mới dữ liệu
            </button>
          </div>
        </header>

        <ul className="admin-summary" role="list">
          <li className="admin-summary-item">
            <span className="admin-summary-label">Tổng số trận</span>
            <strong className="admin-summary-value">{matchCount}</strong>
            <span className="admin-summary-hint">
              Số lịch đã tạo trong hệ thống
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Số vòng</span>
            <strong className="admin-summary-value">{roundCount}</strong>
            <span className="admin-summary-hint">Tổng số vòng thi đấu</span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Trận sắp tới</span>
            <strong className="admin-summary-value">
              {upcomingMatch
                ? upcomingMatch.when.toLocaleString("vi-VN")
                : "Chưa xác định"}
            </strong>
            <span className="admin-summary-hint">
              {upcomingMatch ? upcomingMatch.schedule.stadium : "Chờ cập nhật"}
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Mã trận xem trước</span>
            <strong className="admin-summary-value">{matchCodePreview}</strong>
            <span className="admin-summary-hint">
              Tự sinh dựa trên đội 1 và đội 2
            </span>
          </li>
        </ul>

        {error && (
          <div
            className="admin-alert"
            onClick={() => setError("")}
            role="alert"
          >
            {error} — nhấn để ẩn.
          </div>
        )}

        {toast && (
          <div className="admin-toast" onClick={() => setToast("")}>
            {toast}
          </div>
        )}

        <section className="admin-card">
          <header>
            <h2>
              <FaCalendarAlt aria-hidden="true" />{" "}
              {editingId ? "Chỉnh sửa lịch đấu" : "Tạo lịch thi đấu"}
            </h2>
            <span>Chọn đội bóng, khung giờ và sân thi đấu cho từng trận.</span>
          </header>

          <div className="admin-scoreboard">
            <div className="admin-scoreboard-title">
              <span>Mã trận dự kiến</span>
              <strong className="admin-scoreboard-value">
                {matchCodePreview}
              </strong>
            </div>
            <div className="admin-scoreboard-title">
              <span>Sân thi đấu</span>
              <strong className="admin-scoreboard-value">
                {form.stadium || "Chưa xác định"}
              </strong>
            </div>
          </div>

          <form
            className="admin-form-grid is-two-column"
            onSubmit={handleSubmit}
          >
            <div className="admin-field">
              <label className="admin-label" htmlFor="round">
                Vòng thi đấu
              </label>
              <input
                id="round"
                name="round"
                className="admin-input"
                value={form.round}
                onChange={handleChange}
                placeholder="VD: Vòng 1"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="matchOrder">
                STT trận
              </label>
              <input
                id="matchOrder"
                name="matchOrder"
                className="admin-input"
                value={form.matchOrder}
                onChange={handleChange}
                placeholder="VD: 01"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="team1_id">
                Đội 1 (sân nhà)
              </label>
              <select
                id="team1_id"
                name="team1_id"
                className="admin-select"
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
            <div className="admin-field">
              <label className="admin-label" htmlFor="team2_id">
                Đội 2 (khách)
              </label>
              <select
                id="team2_id"
                name="team2_id"
                className="admin-select"
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
            <div className="admin-field">
              <label className="admin-label" htmlFor="date">
                Ngày thi đấu
              </label>
              <input
                id="date"
                name="date"
                className="admin-input"
                value={form.date}
                onChange={handleChange}
                type="date"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="time">
                Giờ thi đấu
              </label>
              <input
                id="time"
                name="time"
                className="admin-input"
                value={form.time}
                onChange={handleChange}
                type="time"
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="stadium">
                Sân thi đấu
              </label>
              <input
                id="stadium"
                name="stadium"
                className="admin-input"
                value={form.stadium}
                onChange={handleChange}
                placeholder="Tự động điền theo đội 1"
                readOnly
                required
              />
            </div>

            <div className="admin-actions">
              {editingId && (
                <button
                  type="button"
                  className="admin-btn is-secondary"
                  onClick={resetForm}
                >
                  Hủy chỉnh sửa
                </button>
              )}
              <button
                type="submit"
                className="admin-btn is-primary"
                disabled={saving}
              >
                <FaPlus /> {editingId ? "Cập nhật lịch" : "Thêm lịch mới"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-card">
          <header>
            <h2>Danh sách lịch thi đấu</h2>
            <span>Tra cứu và chỉnh sửa lịch đã tạo.</span>
          </header>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã trận</th>
                  <th>Vòng</th>
                  <th>STT</th>
                  <th>Đội 1</th>
                  <th>Đội 2</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Sân</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="admin-empty-state">
                        Chưa có lịch thi đấu nào được tạo.
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{schedule.match_code}</td>
                      <td>{schedule.round}</td>
                      <td>{schedule.matchOrder}</td>
                      <td>
                        {schedule.team1_code ? `[${schedule.team1_code}] ` : ""}
                        {schedule.team1}
                      </td>
                      <td>
                        {schedule.team2_code ? `[${schedule.team2_code}] ` : ""}
                        {schedule.team2}
                      </td>
                      <td>
                        {new Date(schedule.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td>{schedule.time}</td>
                      <td>{schedule.stadium}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn is-secondary is-compact"
                          onClick={() => handleEdit(schedule)}
                        >
                          <FaEdit /> Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-btn is-danger is-compact"
                          onClick={() => handleDelete(schedule.id)}
                          style={{ marginLeft: "0.5rem" }}
                        >
                          <FaTrash /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScheduleManagement;

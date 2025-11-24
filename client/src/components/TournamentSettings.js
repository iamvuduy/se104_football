import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminPanels.css";

const priorityLabels = {
  points: "Điểm số",
  goal_difference: "Hiệu số",
  goals_for: "Bàn thắng",
  goals_against: "Bàn thua",
  away_goals: "Bàn sân khách",
  head_to_head: "Đối đầu trực tiếp",
};

const numericFields = [
  "player_min_age",
  "player_max_age",
  "team_min_players",
  "team_max_players",
  "foreign_player_limit",
  "goal_time_limit",
  "points_win",
  "points_draw",
  "points_loss",
];

const fieldLabels = {
  player_min_age: "Tuổi tối thiểu",
  player_max_age: "Tuổi tối đa",
  team_min_players: "Số cầu thủ tối thiểu",
  team_max_players: "Số cầu thủ tối đa",
  foreign_player_limit: "Giới hạn cầu thủ nước ngoài",
  goal_time_limit: "Thời điểm ghi bàn tối đa",
  points_win: "Điểm khi thắng",
  points_draw: "Điểm khi hòa",
  points_loss: "Điểm khi thua",
};

const TournamentSettings = () => {
  const { token, canAccessFeature } = useAuth();
  const canManageSettings = canAccessFeature("manage_settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const headers = useMemo(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  useEffect(() => {
    if (!token || !canManageSettings) {
      setForm(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/settings", {
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Không thể tải cài đặt.");
        }
        const data = await response.json();
        if (isMounted) {
          setForm(data?.data || null);
        }
      } catch (err) {
        if (err.name === "AbortError" || !isMounted) {
          return;
        }
        setError(err.message || "Đã xảy ra lỗi.");
        setForm(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [headers, token, refreshKey, canManageSettings]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value === "" ? "" : Number(value));
  };

  const handleAddGoalType = (event) => {
    event.preventDefault();
    const trimmed = goalDraft.trim();
    if (!trimmed) {
      return;
    }
    if (form.goal_types.includes(trimmed)) {
      setGoalDraft("");
      return;
    }
    updateField("goal_types", [...form.goal_types, trimmed]);
    setGoalDraft("");
  };

  const handleRemoveGoalType = (type) => {
    updateField(
      "goal_types",
      form.goal_types.filter((item) => item !== type)
    );
  };

  const handlePriorityDragStart = (event, fromIndex) => {
    event.dataTransfer.setData("text/plain", String(fromIndex));
  };

  const handlePriorityDragOver = (event) => {
    event.preventDefault();
  };

  const handlePriorityDrop = (event, targetIndex) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isInteger(fromIndex) || fromIndex === targetIndex) {
      return;
    }
    setForm((prev) => {
      const next = [...prev.ranking_priority];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...prev,
        ranking_priority: next,
      };
    });
  };

  const handleSave = async () => {
    setError(null);
    setToast(null);
    try {
      const prepared = { ...form };

      numericFields.forEach((key) => {
        const raw = form[key];
        if (raw === "" || raw === null || raw === undefined) {
          throw new Error(`${fieldLabels[key]} không được để trống.`);
        }
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`${fieldLabels[key]} phải là số hợp lệ.`);
        }
        prepared[key] = parsed;
      });

      if (!Array.isArray(form.goal_types) || form.goal_types.length === 0) {
        setSaving(true);

        throw new Error("Cần ít nhất một loại bàn thắng.");
      }
      const cleanedGoalTypes = form.goal_types
        .map((item) => String(item).trim())
        .filter(
          (item, index, arr) => item.length > 0 && arr.indexOf(item) === index
        );
      if (cleanedGoalTypes.length === 0) {
        throw new Error("Cần ít nhất một loại bàn thắng.");
      }
      prepared.goal_types = cleanedGoalTypes;

      if (
        !Array.isArray(form.ranking_priority) ||
        form.ranking_priority.length === 0
      ) {
        throw new Error("Cần ít nhất một tiêu chí xếp hạng.");
      }
      const cleanedPriority = form.ranking_priority.filter(
        (item, index, arr) => arr.indexOf(item) === index
      );
      if (cleanedPriority.length === 0) {
        throw new Error("Cần ít nhất một tiêu chí xếp hạng.");
      }
      prepared.ranking_priority = cleanedPriority;

      setSaving(true);
      setError(null);
      setToast(null);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({ settings: prepared }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Không thể lưu cài đặt.");
      }
      const data = await response.json();
      setForm(data?.data || prepared);
      setToast(data?.message || "Đã lưu cài đặt thành công.");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Khôi phục toàn bộ quy định về mặc định?")) {
      return;
    }
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Không thể khôi phục cài đặt.");
      }
      const data = await res.json();
      setForm(data?.data || form);
      setToast(data?.message || "Đã khôi phục mặc định.");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi khôi phục.");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const summaryCards = useMemo(() => {
    if (!form) {
      return [];
    }

    const safeNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : "-";
    };

    const priorityDisplay = Array.isArray(form.ranking_priority)
      ? form.ranking_priority.map((item) => priorityLabels[item] || item)
      : [];

    const compactPriority = priorityDisplay.slice(0, 3).join(" › ");
    const priorityHint =
      priorityDisplay.length > 3
        ? `+${priorityDisplay.length - 3} tiêu chí`
        : "Ưu tiên áp dụng";

    return [
      {
        id: "age-range",
        label: "Độ tuổi hợp lệ",
        value: `${safeNumber(form.player_min_age)} – ${safeNumber(
          form.player_max_age
        )}`,
        hint: "Tuổi tối thiểu / tối đa",
      },
      {
        id: "team-size",
        label: "Quy mô đội bóng",
        value: `${safeNumber(form.team_min_players)} – ${safeNumber(
          form.team_max_players
        )} cầu thủ`,
        hint: "Tối thiểu / tối đa",
      },
      {
        id: "foreign-limit",
        label: "Cầu thủ ngoại",
        value: `${safeNumber(form.foreign_player_limit)}`,
        hint: "Giới hạn đăng ký",
      },
      {
        id: "points",
        label: "Điểm số trận đấu",
        value: `${safeNumber(form.points_win)}/${safeNumber(
          form.points_draw
        )}/${safeNumber(form.points_loss)}`,
        hint: "Thắng / Hòa / Thua",
      },
      {
        id: "goal-types",
        label: "Loại bàn thắng",
        value: `${form.goal_types?.length || 0}`,
        hint: "Mẫu hiện có",
      },
      {
        id: "ranking",
        label: "Tiêu chí xếp hạng",
        value: compactPriority || "Chưa cấu hình",
        hint: priorityHint,
      },
    ];
  }, [form]);

  if (!canManageSettings) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Quyền hạn hạn chế</span>
              <h1>Cài đặt giải đấu</h1>
              <p>
                Chỉ quản trị viên giải đấu mới được phép tùy chỉnh thông số.
              </p>
            </div>
          </header>
          <div className="admin-alert" role="alert">
            Bạn không có quyền truy cập chức năng này.
          </div>
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
              <span className="admin-hero-badge">Đang đồng bộ</span>
              <h1>Cài đặt giải đấu</h1>
              <p>Hệ thống đang tải cấu hình mới nhất, vui lòng chờ giây lát.</p>
            </div>
          </header>
          <div className="admin-loading">Đang tải cấu hình...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Không có dữ liệu</span>
              <h1>Cài đặt giải đấu</h1>
              <p>Không thể tải dữ liệu cấu hình. Vui lòng thử lại sau.</p>
            </div>
            <div className="admin-hero-actions">
              <button
                type="button"
                className="admin-btn is-ghost"
                onClick={handleReload}
              >
                Thử tải lại
              </button>
            </div>
          </header>
          {error && (
            <div className="admin-alert" onClick={() => setError(null)}>
              {error} (bấm để ẩn)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-wrapper">
        <header className="admin-hero">
          <div>
            <span className="admin-hero-badge">Trung tâm cấu hình</span>
            <h1>Cài đặt giải đấu</h1>
            <p>
              Quản lý quy tắc giải đấu, giới hạn đội hình và mô hình tính điểm
              cho toàn bộ hệ thống.
            </p>
          </div>
          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-btn is-ghost"
              onClick={handleReload}
              disabled={saving}
            >
              Làm mới dữ liệu
            </button>
          </div>
        </header>

        {summaryCards.length > 0 && (
          <ul className="admin-summary" role="list">
            {summaryCards.map((item) => (
              <li key={item.id} className="admin-summary-item">
                <span className="admin-summary-label">{item.label}</span>
                <strong className="admin-summary-value">{item.value}</strong>
                <span className="admin-summary-hint">{item.hint}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="admin-alert" onClick={() => setError(null)}>
            {error} (bấm để ẩn)
          </div>
        )}

        {toast && (
          <div className="admin-toast" onClick={() => setToast(null)}>
            {toast}
          </div>
        )}

        <section className="admin-card">
          <header>
            <h2>Quy định cầu thủ & đội bóng</h2>
            <span>Điều chỉnh giới hạn đăng ký cầu thủ cho từng đội.</span>
          </header>
          <div className="admin-form-grid is-two-column">
            <label className="admin-field">
              <span className="admin-label">Tuổi tối thiểu</span>
              <input
                type="number"
                name="player_min_age"
                min="0"
                className="admin-input"
                value={form.player_min_age}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Tuổi tối đa</span>
              <input
                type="number"
                name="player_max_age"
                min="0"
                className="admin-input"
                value={form.player_max_age}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Số cầu thủ tối thiểu</span>
              <input
                type="number"
                name="team_min_players"
                min="0"
                className="admin-input"
                value={form.team_min_players}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Số cầu thủ tối đa</span>
              <input
                type="number"
                name="team_max_players"
                min="0"
                className="admin-input"
                value={form.team_max_players}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Giới hạn cầu thủ nước ngoài</span>
              <input
                type="number"
                name="foreign_player_limit"
                min="0"
                className="admin-input"
                value={form.foreign_player_limit}
                onChange={handleNumberChange}
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <header>
            <h2>Quy định bàn thắng</h2>
            <span>Tùy chỉnh loại bàn thắng và giới hạn thời gian ghi bàn.</span>
          </header>
          <div className="admin-scoreboard">
            <div className="admin-scoreboard-title">
              <span>Loại bàn thắng hiện có</span>
              <strong className="admin-scoreboard-value">
                {form.goal_types.length}
              </strong>
            </div>
            <div className="admin-scoreboard-title">
              <span>Giới hạn thời điểm</span>
              <strong className="admin-scoreboard-value">
                {form.goal_time_limit}&apos;
              </strong>
            </div>
          </div>
          <form className="admin-form-grid" onSubmit={handleAddGoalType}>
            <div className="admin-field">
              <label className="admin-label" htmlFor="goal-type-input">
                Thêm loại bàn thắng
              </label>
              <div className="admin-inline">
                <input
                  id="goal-type-input"
                  type="text"
                  className="admin-input"
                  value={goalDraft}
                  placeholder="Nhập tên loại bàn thắng"
                  onChange={(event) => setGoalDraft(event.target.value)}
                />
                <button
                  type="submit"
                  className="admin-btn is-primary"
                  disabled={!goalDraft.trim()}
                >
                  Thêm
                </button>
              </div>
            </div>
          </form>
          <ul className="ts-chip-list">
            {form.goal_types.map((type) => (
              <li key={type} className="ts-chip">
                <span>{type}</span>
                <button
                  type="button"
                  className="ts-chip-remove"
                  onClick={() => handleRemoveGoalType(type)}
                  aria-label={`Xóa loại bàn thắng ${type}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <label className="admin-field">
            <span className="admin-label">Thời điểm ghi bàn tối đa (phút)</span>
            <input
              type="number"
              name="goal_time_limit"
              min="0"
              className="admin-input"
              value={form.goal_time_limit}
              onChange={handleNumberChange}
            />
          </label>
        </section>

        <section className="admin-card">
          <header>
            <h2>Quy định xếp hạng</h2>
            <span>Thiết lập điểm số và thứ tự ưu tiên khi xếp hạng.</span>
          </header>
          <div className="admin-form-grid is-two-column">
            <label className="admin-field">
              <span className="admin-label">Điểm khi thắng</span>
              <input
                type="number"
                name="points_win"
                min="0"
                className="admin-input"
                value={form.points_win}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Điểm khi hòa</span>
              <input
                type="number"
                name="points_draw"
                min="0"
                className="admin-input"
                value={form.points_draw}
                onChange={handleNumberChange}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Điểm khi thua</span>
              <input
                type="number"
                name="points_loss"
                min="0"
                className="admin-input"
                value={form.points_loss}
                onChange={handleNumberChange}
              />
            </label>
          </div>
          <div className="ts-priority">
            <h3>Thứ tự ưu tiên</h3>
            <p>Kéo và thả để sắp xếp tiêu chí xếp hạng.</p>
            <ul className="ts-priority-list">
              {form.ranking_priority.map((item, index) => (
                <li
                  key={item}
                  className="ts-priority-item"
                  draggable
                  onDragStart={(event) => handlePriorityDragStart(event, index)}
                  onDragOver={handlePriorityDragOver}
                  onDrop={(event) => handlePriorityDrop(event, index)}
                >
                  <span className="ts-priority-handle" aria-hidden="true">
                    ☰
                  </span>
                  <span>{priorityLabels[item] || item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="admin-actions">
          <button
            type="button"
            className="admin-btn is-danger"
            onClick={handleReset}
            disabled={saving}
          >
            Đặt lại mặc định
          </button>
          <button
            type="button"
            className="admin-btn is-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TournamentSettings;

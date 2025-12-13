import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaEdit, FaUndo } from "react-icons/fa";
import "./TournamentSettings.css";

const RANKING_LABELS = {
  points: "Điểm số",
  goal_difference: "Hiệu số",
  goals_for: "Bàn thắng",
  goals_against: "Bàn thua",
  away_goals: "Tổng bàn thắng sân khách",
  head_to_head: "Đối đầu",
};

const TournamentSettings = () => {
  const { token, canAccessFeature } = useAuth();
  const canManageSettings = canAccessFeature("manage_settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState(null);
  const [editModal, setEditModal] = useState(null); // { key, label, value, type, note }

  const headers = useMemo(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  // Define all settings with metadata - grouped for better organization
  const settingsConfig = useMemo(
    () => [
      {
        key: "player_age_range",
        label: "Độ tuổi cầu thủ",
        type: "range",
        fields: ["player_min_age", "player_max_age"],
        note: "Độ tuổi hợp lệ để đăng ký thi đấu",
        category: "Quy định cầu thủ",
      },
      {
        key: "team_size",
        label: "Số lượng cầu thủ trong đội",
        type: "range",
        fields: ["team_min_players", "team_max_players"],
        note: "Số cầu thủ tối thiểu và tối đa",
        category: "Quy định đội bóng",
      },
      {
        key: "foreign_player_limit",
        label: "Giới hạn cầu thủ nước ngoài",
        type: "number",
        note: "Số lượng cầu thủ nước ngoài tối đa",
        category: "Quy định đội bóng",
      },
      {
        key: "goal_time_limit",
        label: "Thời điểm ghi bàn tối đa",
        type: "number",
        note: "Phút thi đấu tối đa (ví dụ: 90')",
        category: "Quy định bàn thắng",
      },
      {
        key: "goal_types",
        label: "Loại bàn thắng",
        type: "goal_types",
        note: "Danh sách các loại bàn thắng được phép",
        category: "Quy định bàn thắng",
      },
      {
        key: "points_system",
        label: "Hệ thống điểm số",
        type: "points",
        fields: ["points_win", "points_draw", "points_loss"],
        note: "Điểm khi Thắng / Hòa / Thua",
        category: "Quy định điểm số",
      },
      {
        key: "ranking_priority",
        label: "Tiêu chí xếp hạng",
        type: "ranking",
        note: "Thứ tự ưu tiên khi xếp hạng",
        category: "Quy định xếp hạng",
      },
    ],
    []
  );

  useEffect(() => {
    if (!token || !canManageSettings) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/settings", { headers });
        if (!response.ok) {
          throw new Error("Không thể tải cài đặt.");
        }
        const data = await response.json();
        setSettings(data?.data || null);
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi.");
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [headers, token, canManageSettings]);

  const handleEdit = (config) => {
    if (config.type === "range" || config.type === "points") {
      // For grouped settings, pass all field values
      const values = config.fields.map((field) => settings[field]);
      setEditModal({
        key: config.key,
        label: config.label,
        values: values,
        fields: config.fields,
        type: config.type,
        note: config.note,
      });
    } else if (config.type === "goal_types") {
      setEditModal({
        key: config.key,
        label: config.label,
        value: [...settings[config.key]], // Copy array
        type: config.type,
        note: config.note,
      });
    } else {
      // For single settings
      setEditModal({
        key: config.key,
        label: config.label,
        value: settings[config.key],
        type: config.type,
        note: config.note,
      });
    }
  };

  const handleModalSave = async () => {
    if (!editModal) return;

    try {
      setSaving(true);
      setError(null);

      let updatedSettings = { ...settings };

      if (editModal.type === "range" || editModal.type === "points") {
        // Update multiple fields
        editModal.fields.forEach((field, index) => {
          updatedSettings[field] = Number(editModal.values[index]);
        });
      } else if (editModal.type === "goal_types") {
        // Clean and validate goal types
        const cleanedTypes = editModal.value
          .map((type) => String(type).trim())
          .filter((type) => type.length > 0);

        if (cleanedTypes.length === 0) {
          setError("Phải có ít nhất một loại bàn thắng");
          setSaving(false);
          return;
        }

        updatedSettings[editModal.key] = cleanedTypes;
      } else {
        // Update single field
        updatedSettings[editModal.key] =
          editModal.type === "number"
            ? Number(editModal.value)
            : editModal.value;
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Không thể lưu cài đặt.");
      }

      const data = await response.json();
      setSettings(data?.data || updatedSettings);
      setToast(`Đã cập nhật: ${editModal.label}`);
      setEditModal(null);
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
      setSettings(data?.data || settings);
      setToast(data?.message || "Đã khôi phục mặc định.");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi khôi phục.");
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (config) => {
    if (config.type === "range") {
      const [min, max] = config.fields.map((field) => settings[field]);
      return `${min} - ${max}`;
    }
    if (config.type === "points") {
      const [win, draw, loss] = config.fields.map((field) => settings[field]);
      return `${win} / ${draw} / ${loss}`;
    }
    if (config.type === "ranking") {
      const value = settings[config.key];
      if (Array.isArray(value)) {
        return value.map((k) => RANKING_LABELS[k] || k).join(" > ");
      }
    }
    if (config.type === "goal_types") {
      const value = settings[config.key];
      if (Array.isArray(value)) {
        return value.join(", ");
      }
    }
    const value = settings[config.key];
    if (Array.isArray(value)) {
      return `${value.length} mục`;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return value || "-";
  };

  // Helper for ranking editor
  const moveItem = (index, direction) => {
    if (!editModal || !Array.isArray(editModal.value)) return;
    const newList = [...editModal.value];

    // Prevent moving the first item (points) or swapping with it
    if (index === 0) return; // Cannot move the first item
    if (direction === "up" && index === 1) return; // Cannot swap with the first item

    if (direction === "up" && index > 0) {
      [newList[index], newList[index - 1]] = [
        newList[index - 1],
        newList[index],
      ];
    } else if (direction === "down" && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [
        newList[index + 1],
        newList[index],
      ];
    }
    setEditModal({ ...editModal, value: newList });
  };

  const toggleRankingItem = (key) => {
    if (!editModal || !Array.isArray(editModal.value)) return;

    // Prevent removing points
    if (key === "points") return;

    const currentList = editModal.value;
    if (currentList.includes(key)) {
      // Remove (but prevent removing the last one)
      if (currentList.length > 1) {
        setEditModal({
          ...editModal,
          value: currentList.filter((k) => k !== key),
        });
      }
    } else {
      // Add to end
      setEditModal({ ...editModal, value: [...currentList, key] });
    }
  };

  if (!canManageSettings) {
    return (
      <div className="tournament-settings-container">
        <div className="tournament-settings-card">
          <div className="tournament-settings-header">
            <h1>Cài đặt giải đấu</h1>
            <p>Bạn không có quyền truy cập chức năng này</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tournament-settings-container">
        <div className="tournament-settings-card">
          <div className="tournament-settings-header">
            <h1>Cài đặt giải đấu</h1>
            <p>Đang tải dữ liệu...</p>
          </div>
          <div className="settings-loading">Đang tải cấu hình...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="tournament-settings-container">
        <div className="tournament-settings-card">
          <div className="tournament-settings-header">
            <h1>Cài đặt giải đấu</h1>
            <p>Không thể tải dữ liệu</p>
          </div>
          {error && <div className="settings-error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-settings-container">
      <div className="tournament-settings-card">
        <div className="tournament-settings-header">
          <h1>Thay đổi quy định</h1>
          <p>Quản lý và điều chỉnh các quy định của giải đấu</p>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "#fee2e2",
              color: "#b91c1c",
              margin: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {toast && (
          <div
            style={{
              padding: "1rem",
              background: "#d1fae5",
              color: "#065f46",
              margin: "1rem",
            }}
          >
            {toast}
          </div>
        )}

        <div className="settings-table-wrapper">
          <table className="settings-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên quy định</th>
                <th>Thao tác</th>
                <th>Giá trị</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {settingsConfig.map((config, index) => (
                <tr key={config.key}>
                  <td>{index + 1}</td>
                  <td className="setting-name">{config.label}</td>
                  <td className="setting-category">{config.category}</td>
                  <td className="setting-value">{formatValue(config)}</td>
                  <td className="setting-note">{config.note}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(config)}
                      disabled={saving}
                    >
                      <FaEdit /> Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="settings-footer">
          <button
            className="btn btn-reset"
            onClick={handleReset}
            disabled={saving}
          >
            <FaUndo /> Đặt lại mặc định
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setEditModal(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sửa quy định</h3>
            </div>
            <div className="modal-body">
              {editModal.type === "range" ? (
                <>
                  <div className="modal-field">
                    <label className="modal-label">Giá trị tối thiểu</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={editModal.values[0]}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          values: [e.target.value, editModal.values[1]],
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label">Giá trị tối đa</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={editModal.values[1]}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          values: [editModal.values[0], e.target.value],
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div className="modal-hint">{editModal.note}</div>
                </>
              ) : editModal.type === "points" ? (
                <>
                  <div className="modal-field">
                    <label className="modal-label">Điểm khi thắng</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={editModal.values[0]}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          values: [
                            e.target.value,
                            editModal.values[1],
                            editModal.values[2],
                          ],
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label">Điểm khi hòa</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={editModal.values[1]}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          values: [
                            editModal.values[0],
                            e.target.value,
                            editModal.values[2],
                          ],
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label">Điểm khi thua</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={editModal.values[2]}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          values: [
                            editModal.values[0],
                            editModal.values[1],
                            e.target.value,
                          ],
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div className="modal-hint">{editModal.note}</div>
                </>
              ) : editModal.type === "ranking" ? (
                <div className="ranking-editor">
                  <div className="ranking-list">
                    <label className="modal-label">
                      Thứ tự ưu tiên (kéo thả hoặc dùng nút)
                    </label>
                    {editModal.value.map((key, index) => (
                      <div key={key} className="ranking-item">
                        <span>
                          {index + 1}. {RANKING_LABELS[key] || key}
                          {key === "points" && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "0.8em",
                                color: "#666",
                                fontStyle: "italic",
                              }}
                            >
                              (Cố định)
                            </span>
                          )}
                        </span>
                        <div className="ranking-actions">
                          <button
                            type="button"
                            className="btn-rank-action"
                            disabled={index === 0 || index === 1}
                            onClick={() => moveItem(index, "up")}
                            title="Lên trên"
                            style={{
                              visibility: index === 0 ? "hidden" : "visible",
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn-rank-action"
                            disabled={
                              index === editModal.value.length - 1 ||
                              index === 0
                            }
                            onClick={() => moveItem(index, "down")}
                            title="Xuống dưới"
                            style={{
                              visibility: index === 0 ? "hidden" : "visible",
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn-rank-remove"
                            onClick={() => toggleRankingItem(key)}
                            title="Bỏ tiêu chí này"
                            disabled={key === "points"}
                            style={{
                              visibility:
                                key === "points" ? "hidden" : "visible",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ranking-available">
                    <label className="modal-label">Tiêu chí khác:</label>
                    <div className="ranking-available-list">
                      {Object.keys(RANKING_LABELS)
                        .filter((key) => !editModal.value.includes(key))
                        .map((key) => (
                          <button
                            key={key}
                            type="button"
                            className="btn-rank-add"
                            onClick={() => toggleRankingItem(key)}
                          >
                            {RANKING_LABELS[key]}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="modal-hint">{editModal.note}</div>
                </div>
              ) : editModal.type === "goal_types" ? (
                <div className="goal-types-editor">
                  <label className="modal-label">
                    Danh sách loại bàn thắng:
                  </label>
                  {editModal.value.map((type, index) => (
                    <div key={index} className="goal-type-item">
                      <input
                        type="text"
                        className="modal-input"
                        value={type}
                        onChange={(e) => {
                          const newTypes = [...editModal.value];
                          newTypes[index] = e.target.value;
                          setEditModal({ ...editModal, value: newTypes });
                        }}
                        placeholder="Nhập loại bàn thắng"
                      />
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => {
                          if (editModal.value.length > 1) {
                            setEditModal({
                              ...editModal,
                              value: editModal.value.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }
                        }}
                        disabled={editModal.value.length === 1}
                        title="Xóa loại này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => {
                      setEditModal({
                        ...editModal,
                        value: [...editModal.value, ""],
                      });
                    }}
                  >
                    ➕ Thêm loại bàn thắng
                  </button>
                  <div className="modal-hint">{editModal.note}</div>
                </div>
              ) : (
                <div className="modal-field">
                  <label className="modal-label">{editModal.label}</label>
                  <input
                    type={editModal.type}
                    className="modal-input"
                    value={editModal.value}
                    onChange={(e) =>
                      setEditModal({ ...editModal, value: e.target.value })
                    }
                    min={editModal.type === "number" ? 0 : undefined}
                  />
                  <div className="modal-hint">{editModal.note}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setEditModal(null)}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                className="modal-btn modal-btn-save"
                onClick={handleModalSave}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentSettings;

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  FaPencilAlt,
  FaTrash,
  FaSyncAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./AdminPanels.css";
import "./GroupManagement.css";

// Define colors for the group headers
const groupColors = [
  "#343a40", // Black
  "#007bff", // Blue
  "#28a745", // Green
  "#dc3545", // Red
  "#6f42c1", // Purple
  "#fd7e14", // Orange
  "#20c997", // Teal
  "#e83e8c", // Pink
  "#6610f2", // Indigo
  "#17a2b8", // Info
  "#d9480f", // Dark Orange
  "#087f5b", // Dark Teal
  "#b40848", // Dark Pink
  "#5f3dc4", // Dark Purple
  "#004085", // Darker Blue
  "#c82333", // Darker Red
  "#1e7e34", // Darker Green
  "#543800", // Dark Yellow
];

const GroupManagement = () => {
  const { canAccessFeature } = useAuth();
  const canManageGroups = canAccessFeature("manage_groups");
  const [groups, setGroups] = useState([]);
  const [unassignedTeams, setUnassignedTeams] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedOverZone, setDraggedOverZone] = useState(null);
  const [teamSearch, setTeamSearch] = useState("");
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isToastVisible, setIsToastVisible] = useState(false);

  const displayToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setIsToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastTimerRef.current = setTimeout(() => {
      setIsToastVisible(false);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!canManageGroups) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      setLoading(true);
      const groupsResponse = await fetch("/api/groups", { headers });
      const teamsResponse = await fetch("/api/teams?unassigned=true", {
        headers,
      });

      if (!groupsResponse.ok || !teamsResponse.ok) {
        throw new Error("Không thể tải dữ liệu.");
      }

      const groupsData = await groupsResponse.json();
      const teamsData = await teamsResponse.json();

      setGroups(groupsData.groups || []);
      setUnassignedTeams(teamsData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      displayToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [displayToast, canManageGroups]);

  useEffect(() => {
    if (!canManageGroups) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, canManageGroups]);

  const handleApiCall = async (url, options) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Đã xảy ra lỗi API");
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      displayToast(err.message, "error");
      return null;
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!canManageGroups) return;
    if (!newGroupName.trim()) return;
    const result = await handleApiCall("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: newGroupName }),
    });
    if (result) {
      setNewGroupName("");
      fetchData();
      displayToast("Đã tạo bảng đấu mới.", "success");
    }
  };

  const handleUpdateGroup = async (groupId) => {
    if (!canManageGroups) return;
    if (!editingGroupName.trim()) return;
    const result = await handleApiCall(`/api/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingGroupName }),
    });
    if (result) {
      setEditingGroupId(null);
      setEditingGroupName("");
      fetchData();
      displayToast("Đã cập nhật tên bảng đấu.", "success");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!canManageGroups) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa bảng đấu này không?")) {
      const result = await handleApiCall(`/api/groups/${groupId}`, {
        method: "DELETE",
      });
      if (result) {
        fetchData();
        displayToast("Đã xóa bảng đấu.", "warning");
      }
    }
  };

  const handleDragStart = (e, team, sourceGroupId) => {
    e.dataTransfer.setData("teamId", team.id);
    e.dataTransfer.setData("sourceGroupId", sourceGroupId);
  };

  const handleDragOver = (e, targetZoneId) => {
    e.preventDefault();
    if (targetZoneId !== null) {
      const targetGroup = groups.find((g) => g.id == targetZoneId);
      if (targetGroup?.teams?.length >= 4) {
        setDraggedOverZone(null);
        return;
      }
    }
    setDraggedOverZone(targetZoneId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOverZone(null);
  };

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault();
    if (!canManageGroups) return;
    setDraggedOverZone(null);

    const teamId = e.dataTransfer.getData("teamId");
    const sourceGroupId = e.dataTransfer.getData("sourceGroupId");

    if (String(sourceGroupId) === String(targetGroupId)) return;

    const movedTeam =
      sourceGroupId === "null"
        ? unassignedTeams.find((t) => t.id == teamId)
        : groups
            .find((g) => g.id == sourceGroupId)
            ?.teams.find((t) => t.id == teamId);

    if (!movedTeam) return;

    if (targetGroupId !== null) {
      const targetGroup = groups.find((g) => g.id == targetGroupId);
      if ((targetGroup?.teams?.length || 0) >= 4) {
        displayToast("Bảng này đã đủ 4 đội.", "warning");
        return;
      }
    }

    if (sourceGroupId === "null") {
      setUnassignedTeams((prev) => prev.filter((t) => t.id != teamId));
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id == sourceGroupId
            ? { ...g, teams: g.teams.filter((t) => t.id != teamId) }
            : g
        )
      );
    }

    if (targetGroupId === null) {
      setUnassignedTeams((prev) => [...prev, movedTeam]);
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id == targetGroupId ? { ...g, teams: [...g.teams, movedTeam] } : g
        )
      );
    }

    const result = await handleApiCall("/api/groups/assign-team", {
      method: "POST",
      body: JSON.stringify({
        teamId: parseInt(teamId),
        groupId: targetGroupId,
      }),
    });

    if (!result) {
      fetchData();
    } else {
      displayToast("Đã cập nhật phân đội.", "success");
    }
  };

  const filteredUnassignedTeams = unassignedTeams.filter((team) =>
    team.name?.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const { totalGroups, assignedCount, capacity, openSlots, utilization } =
    useMemo(() => {
      const total = groups.length;
      const assigned = groups.reduce(
        (acc, group) => acc + (group.teams?.length || 0),
        0
      );
      const totalCapacity = total * 4;
      const remaining = Math.max(0, totalCapacity - assigned);
      const ratio = totalCapacity
        ? Math.round((assigned / totalCapacity) * 100)
        : 0;
      return {
        totalGroups: total,
        assignedCount: assigned,
        capacity: totalCapacity,
        openSlots: remaining,
        utilization: ratio,
      };
    }, [groups]);

  if (!canManageGroups) {
    return (
      <div className="group-management-shell">
        <div className="gm-page">
          <div className="gm-board-empty">
            <h3>Không có quyền truy cập</h3>
            <p>
              Bạn không được cấp phép để quản lý bảng đấu. Vui lòng liên hệ quản
              trị hệ thống để được phân quyền.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Đang tải</span>
              <h1>Quản lý bảng đấu</h1>
              <p>Hệ thống đang đồng bộ thông tin bảng và danh sách đội.</p>
            </div>
          </header>
          <div className="admin-loading">Đang chuẩn bị dữ liệu...</div>
        </div>
      </div>
    );

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="group-management-shell">
      <div className="gm-page">
        {isToastVisible && (
          <div
            className={`gm-toast gm-toast-${toast.type}`}
            onClick={() => {
              setIsToastVisible(false);
              if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
              }
            }}
            role="alert"
          >
            {toast.message}
          </div>
        )}
        {error && (
          <div className="gm-alert" onClick={() => setError(null)}>
            {error} — nhấn để ẩn.
          </div>
        )}

        <header className="gm-page-hero">
          <div className="gm-hero-copy">
            <span className="gm-hero-tag">Trung tâm điều phối</span>
            <h1>Quản lý bảng đấu</h1>
            <p>
              Sắp xếp các đội nhanh chóng, theo dõi trạng thái lấp đầy và tùy
              biến tên bảng ngay tại một nơi.
            </p>
          </div>
          <div className="gm-hero-actions">
            <button
              type="button"
              className="gm-btn is-ghost"
              onClick={handleRefresh}
            >
              <FaSyncAlt /> Làm mới dữ liệu
            </button>
          </div>
        </header>

        <section className="gm-insights">
          <article className="gm-insight-card">
            <span className="gm-insight-label">Số bảng đấu</span>
            <strong className="gm-insight-value">{totalGroups}</strong>
            <span className="gm-insight-hint">Đang hoạt động</span>
          </article>
          <article className="gm-insight-card">
            <span className="gm-insight-label">Đội đã phân</span>
            <strong className="gm-insight-value">{assignedCount}</strong>
            <span className="gm-insight-hint">Trên tổng {capacity} suất</span>
          </article>
          <article className="gm-insight-card">
            <span className="gm-insight-label">Đội chờ phân</span>
            <strong className="gm-insight-value">
              {unassignedTeams.length}
            </strong>
            <span className="gm-insight-hint">Có sẵn để kéo thả</span>
          </article>
          <article className="gm-insight-card">
            <span className="gm-insight-label">Tỉ lệ lấp đầy</span>
            <strong className="gm-insight-value">{utilization}%</strong>
            <span className="gm-insight-hint">Còn {openSlots} suất trống</span>
          </article>
        </section>

        <div className="gm-layout">
          <aside className="gm-panel">
            <section className="gm-card gm-create-card">
              <header className="gm-card-head">
                <div>
                  <h2>Tạo bảng đấu</h2>
                  <span>Đặt tên ngắn gọn để tiện theo dõi.</span>
                </div>
              </header>
              <form onSubmit={handleCreateGroup} className="gm-form">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Bảng A"
                  required
                  className="gm-input"
                />
                <button type="submit" className="gm-btn is-primary">
                  Tạo bảng mới
                </button>
              </form>
              <p className="gm-card-note">
                Mẹo: kéo thả thẻ đội từ bất kỳ bảng nào vào khu này để hủy phân
                bổ.
              </p>
            </section>

            <section
              className={`gm-card gm-unassigned ${
                draggedOverZone === null ? "is-drop-target" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              <header className="gm-card-head">
                <div>
                  <h2>Đội chờ phân</h2>
                  <span>Kéo vào bảng phù hợp hoặc thả lại đây để bỏ.</span>
                </div>
                <span className="gm-chip">{unassignedTeams.length}</span>
              </header>
              <div className="gm-search">
                <input
                  type="search"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Tìm theo tên đội"
                  className="gm-input"
                />
              </div>
              <div className="gm-team-scroll">
                {filteredUnassignedTeams.length > 0 ? (
                  filteredUnassignedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="gm-team-pill"
                      draggable
                      onDragStart={(e) => handleDragStart(e, team, "null")}
                    >
                      <span className="gm-team-bullet" aria-hidden="true" />
                      <span>{team.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="gm-empty-hint">
                    {teamSearch
                      ? "Không tìm thấy đội phù hợp."
                      : "Tất cả đội đã được phân bổ."}
                  </div>
                )}
              </div>
            </section>
          </aside>

          <main className="gm-board">
            <div className="gm-board-header">
              <div>
                <h2>Danh sách bảng</h2>
                <p>
                  Quan sát từng bảng theo dạng thẻ, kéo thả để cân bằng lực
                  lượng hoặc đổi tên ngay khi cần.
                </p>
              </div>
              <div className="gm-board-meta">
                <span>
                  {assignedCount}/{capacity} suất đã dùng
                </span>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="gm-board-empty">
                <h3>Chưa có bảng đấu nào</h3>
                <p>Tạo bảng ở khung bên trái để bắt đầu phân nhóm.</p>
              </div>
            ) : (
              <div className="gm-group-grid">
                {groups.map((group, index) => {
                  const accent = groupColors[index % groupColors.length];
                  const teamsInGroup = group.teams || [];
                  const isGroupFull = teamsInGroup.length >= 4;
                  const placeholders = Array.from({
                    length: Math.max(0, 4 - teamsInGroup.length),
                  });

                  return (
                    <section
                      key={group.id}
                      className={`gm-group-card ${
                        isGroupFull ? "is-full" : ""
                      } ${
                        draggedOverZone === group.id ? "is-drop-target" : ""
                      }`}
                      style={{ "--accent-color": accent }}
                      onDragOver={(e) => handleDragOver(e, group.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, group.id)}
                    >
                      <header className="gm-group-header">
                        <div className="gm-group-title">
                          <span className="gm-badge">Bảng đấu</span>
                          {editingGroupId === group.id ? (
                            <input
                              type="text"
                              className="gm-group-input"
                              value={editingGroupName}
                              onChange={(e) =>
                                setEditingGroupName(e.target.value)
                              }
                              placeholder="Tên bảng"
                              autoFocus
                            />
                          ) : (
                            <h3>{group.name}</h3>
                          )}
                        </div>
                        <div className="gm-group-side">
                          <span className="gm-capacity">
                            {teamsInGroup.length}/4 đội
                          </span>
                          <div className="gm-group-actions">
                            {editingGroupId === group.id ? (
                              <>
                                <button
                                  type="button"
                                  className="gm-icon-btn is-confirm"
                                  onClick={() => handleUpdateGroup(group.id)}
                                  aria-label="Lưu tên bảng"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  type="button"
                                  className="gm-icon-btn is-muted"
                                  onClick={() => {
                                    setEditingGroupId(null);
                                    setEditingGroupName("");
                                  }}
                                  aria-label="Hủy chỉnh sửa"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="gm-icon-btn"
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditingGroupName(group.name);
                                  }}
                                  aria-label={`Chỉnh sửa ${group.name}`}
                                >
                                  <FaPencilAlt />
                                </button>
                                <button
                                  type="button"
                                  className="gm-icon-btn is-danger"
                                  onClick={() => handleDeleteGroup(group.id)}
                                  aria-label={`Xóa ${group.name}`}
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </header>

                      <ul className="gm-slot-list">
                        {teamsInGroup.map((team, teamIndex) => (
                          <li
                            key={team.id}
                            className="gm-slot-item"
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, team, group.id)
                            }
                          >
                            <span className="gm-slot-index">
                              {teamIndex + 1}
                            </span>
                            <span className="gm-slot-name">{team.name}</span>
                            <span className="gm-slot-tag">Đã phân</span>
                          </li>
                        ))}
                        {placeholders.map((_, idx) => (
                          <li key={idx} className="gm-slot-item is-empty">
                            <span className="gm-slot-index">
                              {teamsInGroup.length + idx + 1}
                            </span>
                            <span className="gm-slot-name">
                              Chỗ trống chờ đội
                            </span>
                            <span className="gm-slot-tag">Kéo đội vào</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;

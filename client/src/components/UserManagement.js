import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./AdminPanels.css";
import {
  FaUsersCog,
  FaTrash,
  FaUserShield,
  FaSyncAlt,
  FaEdit,
  FaEye,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { ROLE_OPTIONS, ROLE_LABELS, resolveRole, ROLES } from "../utils/roles";
import {
  FEATURE_DEFINITIONS,
  ROLE_ORDER as PERMISSION_ROLE_ORDER,
  sanitizePermissionMatrix,
} from "../utils/permissions";

const UserManagement = () => {
  const { user, canAccessFeature, featurePermissions, refreshPermissions } =
    useAuth();
  const canManageUsers = canAccessFeature("manage_users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [permissionMatrix, setPermissionMatrix] = useState(() =>
    sanitizePermissionMatrix(featurePermissions.matrix)
  );
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // { id, username, fullName, email, dob, position, newPassword }

  // Search and filter states
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Role management states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [customRoles, setCustomRoles] = useState([]);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setToast("");

    try {
      const response = await axios.get("/api/users");
      const users = response.data?.data || response.data || [];
      const normalized = (Array.isArray(users) ? users : []).map((item) => ({
        ...item,
        role: resolveRole(item.role),
      }));
      setUsers(normalized);
    } catch (_err) {
      setError(
        "Không thể tải danh sách người dùng. Có thể bạn thiếu quyền truy cập."
      );
    } finally {
      setLoading(false);
    }
  }, [canManageUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!canManageUsers) {
      return;
    }
    refreshPermissions();
  }, [canManageUsers, refreshPermissions]);

  useEffect(() => {
    const buildSanitizedMatrix = (matrix) => {
      const base = sanitizePermissionMatrix(matrix);
      const result = { ...base };
      const incoming = matrix || {};
      Object.keys(incoming).forEach((roleKey) => {
        if (!Object.prototype.hasOwnProperty.call(result, roleKey)) {
          const roleRow = {};
          FEATURE_DEFINITIONS.forEach((feature) => {
            roleRow[feature.key] = Boolean(
              incoming[roleKey] && incoming[roleKey][feature.key]
            );
          });
          result[roleKey] = roleRow;
        }
      });
      return result;
    };

    setPermissionMatrix(buildSanitizedMatrix(featurePermissions.matrix));
    setPermissionsDirty(false);
  }, [featurePermissions.matrix]);

  const handlePermissionToggle = (roleKey, featureKey) => {
    if (!canManageUsers || roleKey === ROLES.SYSTEM_ADMIN) {
      return;
    }
    setPermissionMatrix((prev) => {
      const currentRole = prev[roleKey] || {};
      const updatedRole = { ...currentRole };
      updatedRole[featureKey] = !currentRole[featureKey];
      return {
        ...prev,
        [roleKey]: updatedRole,
      };
    });
    setPermissionsDirty(true);
  };

  const handleSavePermissions = async () => {
    if (!canManageUsers || !permissionsDirty || permissionsSaving) {
      return;
    }
    setPermissionsSaving(true);
    setError("");
    setToast("");
    try {
      const response = await axios.put("/api/permissions", {
        matrix: permissionMatrix,
      });
      const sanitized = sanitizePermissionMatrix(
        response.data?.matrix || permissionMatrix
      );
      setPermissionMatrix(sanitized);
      setPermissionsDirty(false);
      setToast("Đã lưu cấu hình quyền truy cập.");
      await refreshPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể lưu cấu hình quyền. Vui lòng thử lại."
      );
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!canManageUsers) {
      return;
    }
    const normalizedRole = resolveRole(newRole);
    // Check if role is valid (either standard role in ROLE_LABELS or custom role in permissionMatrix)
    if (!ROLE_LABELS[normalizedRole] && !permissionMatrix[normalizedRole]) {
      setError("Quyền hạn không hợp lệ.");
      return;
    }

    setError("");
    setToast("");
    try {
      await axios.put(`/api/users/${userId}/role`, { role: normalizedRole });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: normalizedRole,
              }
            : user
        )
      );
      setToast("Đã cập nhật quyền hạn người dùng.");
    } catch (_err) {
      setError("Không thể cập nhật quyền hạn. Vui lòng thử lại.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!canManageUsers) {
      return;
    }
    if (!window.confirm(`Xóa tài khoản "${username}"?`)) {
      return;
    }
    setError("");
    setToast("");
    try {
      await axios.delete(`/api/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setToast("Đã xóa người dùng thành công.");
    } catch (_err) {
      setError("Không thể xóa người dùng lúc này.");
    }
  };

  const handleUpdateUserInfo = async () => {
    if (!editingUser) {
      return;
    }

    setError("");
    setToast("");

    try {
      // Update user information
      await axios.put(`/api/users/${editingUser.id}`, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        dob: editingUser.dob,
        position: editingUser.position,
      });

      // Update password if provided
      if (
        editingUser.newPassword &&
        editingUser.newPassword.trim().length > 0
      ) {
        await axios.put(`/api/users/${editingUser.id}/password`, {
          newPassword: editingUser.newPassword,
        });
      }

      setToast(`Đã cập nhật thông tin cho ${editingUser.username}.`);
      setEditingUser(null);
      loadUsers(); // Reload user list
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể cập nhật thông tin người dùng."
      );
    }
  };

  const handleCreateGroup = async () => {
    if (!newRoleName.trim()) {
      setError("Tên vai trò không được để trống.");
      return;
    }

    setError("");
    setToast("");

    try {
      const response = await axios.post("/api/roles", {
        name: newRoleName,
      });
      setToast("Đã tạo vai trò mới thành công.");
      setNewRoleName("");
      setShowRoleModal(false);
      // Refresh permissions/roles from server so the new role appears
      try {
        await refreshPermissions();
      } catch (e) {
        // ignore refresh error but user already got success toast
      }
      setCurrentPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tạo vai trò.");
    }
  };

  const handleDeleteGroup = async (roleId, roleName) => {
    if (!window.confirm(`Xóa vai trò "${roleName}"?`)) {
      return;
    }

    setError("");
    setToast("");

    try {
      await axios.delete(`/api/roles/${roleId}`);
      setToast("Đã xóa vai trò thành công.");
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể xóa vai trò.");
    }
  };

  const handleDeleteRole = async (roleKey, roleLabel) => {
    if (
      !window.confirm(
        `Xóa vai trò "${roleLabel}" và tất cả quyền liên quan?\n\nLưu ý: Người dùng có vai trò này sẽ mất các quyền.`
      )
    ) {
      return;
    }

    setError("");
    setToast("");

    try {
      const response = await axios.delete(`/api/roles/${roleKey}`);
      setToast("Đã xóa vai trò thành công.");
      // Refresh permissions after deletion
      try {
        console.log("Calling refreshPermissions after role deletion...");
        await refreshPermissions();
        console.log("refreshPermissions completed");
      } catch (e) {
        console.error("refreshPermissions error:", e.message);
      }
    } catch (err) {
      console.error("Delete role error:", err);
      setError(err?.response?.data?.message || "Không thể xóa vai trò.");
    }
  };

  const handleToggleUserSelection = (userId) => {
    // Placeholder for future use if needed
  };

  const { totalUsers, adminUsers, normalUsers, distinctRoles } = useMemo(() => {
    const normalizedRoles = users.map((item) => resolveRole(item.role));
    const total = normalizedRoles.length;
    const adminCount = normalizedRoles.filter(
      (role) => role === ROLES.SYSTEM_ADMIN
    ).length;
    const distinct = new Set(normalizedRoles).size;
    return {
      totalUsers: total,
      adminUsers: adminCount,
      normalUsers: total - adminCount,
      distinctRoles: distinct,
    };
  }, [users]);

  // Filtered and paginated users
  const filteredAndPaginatedUsers = useMemo(() => {
    let filtered = users;

    // Filter by search username - must start with the search string
    if (searchUsername.trim()) {
      const query = searchUsername.toLowerCase();
      filtered = filtered.filter((u) =>
        u.username.toLowerCase().startsWith(query)
      );
    }

    // Filter by role
    if (selectedRoleFilter) {
      filtered = filtered.filter(
        (u) => resolveRole(u.role) === selectedRoleFilter
      );
    }

    // Pagination with fixed 5 items per page
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedList = filtered.slice(startIdx, endIdx);

    return {
      filtered,
      paginatedList,
      totalPages,
      totalFiltered: filtered.length,
    };
  }, [users, searchUsername, selectedRoleFilter, currentPage]);

  const featureList = useMemo(() => {
    const list =
      featurePermissions.features && featurePermissions.features.length > 0
        ? featurePermissions.features
        : FEATURE_DEFINITIONS;
    return list.filter(
      (f) => f.key !== "manage_groups" && f.key !== "create_reports"
    );
  }, [featurePermissions.features]);

  const permissionRoleKeys = useMemo(() => {
    const keys = Array.isArray(PERMISSION_ROLE_ORDER)
      ? [...PERMISSION_ROLE_ORDER]
      : [];
    Object.keys(permissionMatrix || {}).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    });
    return keys;
  }, [permissionMatrix]);

  // Build dynamic role options including custom roles
  const dynamicRoleOptions = useMemo(() => {
    return permissionRoleKeys.map((roleKey) => ({
      value: roleKey,
      label: ROLE_LABELS[roleKey] || roleKey,
    }));
  }, [permissionRoleKeys]);

  if (!canManageUsers) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Quyền hạn hạn chế</span>
              <h1>Quản lý người dùng</h1>
              <p>Bạn không có quyền truy cập vào chức năng phân quyền.</p>
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
              <h1>Quản lý người dùng</h1>
              <p>
                Hệ thống đang đồng bộ danh sách tài khoản. Vui lòng chờ trong
                giây lát.
              </p>
            </div>
          </header>
          <div className="admin-loading">Đang tải danh sách người dùng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-wrapper">
        <header className="admin-hero">
          <div>
            <span className="admin-hero-badge">Trung tâm quản trị</span>
            <h1>Quản lý người dùng</h1>
            <p>
              Theo dõi quyền hạn và trạng thái các tài khoản đang hoạt động
              trong giải đấu.
            </p>
          </div>
          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-btn is-ghost"
              onClick={loadUsers}
              disabled={loading}
            >
              <FaSyncAlt /> Làm mới
            </button>
          </div>
        </header>

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
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>
                <FaUsersCog aria-hidden="true" /> Danh sách người dùng
              </h2>
              <span>
                Thay đổi quyền hạn hoặc xóa tài khoản không còn sử dụng.
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <button
                type="button"
                className="admin-btn is-warning"
                onClick={() => setShowRoleModal(true)}
                title="Tạo vai trò mới"
              >
                + Tạo vai trò mới
              </button>
            </div>
          </header>

          {/* Search and Filter Controls */}
          <div
            style={{
              marginBottom: "1.5rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#2c3e50",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                Tìm kiếm theo tên đăng nhập
              </label>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập..."
                value={searchUsername}
                onChange={(e) => {
                  setSearchUsername(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  border: "2px solid #e1e8ed",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  background: "#fafbfc",
                  color: "#1a2332",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#2c3e50",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                Lọc theo vai trò
              </label>
              <select
                value={selectedRoleFilter}
                onChange={(e) => {
                  setSelectedRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  border: "2px solid #e1e8ed",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  background: "#fafbfc",
                  color: "#1a2332",
                }}
              >
                <option value="">Tất cả vai trò</option>
                {dynamicRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: "0.85rem",
                color: "#7f8c9a",
                paddingBottom: "0.625rem",
              }}
            >
              Tìm thấy:{" "}
              <strong>{filteredAndPaginatedUsers.totalFiltered}</strong> /{" "}
              {totalUsers} người
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>STT</th>
                  <th>Tên đăng nhập</th>
                  <th>Quyền hạn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndPaginatedUsers.paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty-state">
                        {filteredAndPaginatedUsers.totalFiltered === 0
                          ? "Không tìm thấy tài khoản nào."
                          : "Không có tài khoản nào trên trang này."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndPaginatedUsers.paginatedList.map(
                    (account, index) => {
                      const normalizedRole = resolveRole(account.role);
                      const isSystemAdmin =
                        normalizedRole === ROLES.SYSTEM_ADMIN;
                      const isLocked =
                        account.username === "admin" || isSystemAdmin;
                      const roleLabel =
                        ROLE_LABELS[normalizedRole] || normalizedRole;
                      const rowNumber = (currentPage - 1) * 10 + index + 1;
                      return (
                        <tr key={account.id}>
                          <td
                            style={{
                              textAlign: "center",
                              fontWeight: 600,
                              color: "#4a90e2",
                            }}
                          >
                            {rowNumber}
                          </td>
                          <td>
                            <div className="admin-inline">
                              <span>{account.username}</span>
                              {isSystemAdmin && (
                                <span className="admin-badge">
                                  <FaUserShield aria-hidden="true" />{" "}
                                  {roleLabel}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              className="admin-select"
                              value={normalizedRole}
                              onChange={(event) =>
                                handleRoleChange(account.id, event.target.value)
                              }
                              disabled={isLocked}
                              aria-label={`Thay đổi quyền hạn cho ${account.username}`}
                            >
                              {dynamicRoleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                className="admin-btn is-primary is-icon admin-icon-btn"
                                onClick={() =>
                                  setEditingUser({
                                    id: account.id,
                                    username: account.username,
                                    fullName: account.fullName || "",
                                    email: account.email || "",
                                    dob: account.dob || "",
                                    position: account.position || "",
                                    newPassword: "",
                                  })
                                }
                                aria-label={`Xem/Sửa thông tin ${account.username}`}
                                title="Xem/Sửa thông tin"
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className="admin-btn is-danger is-icon admin-icon-btn"
                                onClick={() =>
                                  handleDeleteUser(account.id, account.username)
                                }
                                disabled={isLocked}
                                aria-label={`Xóa người dùng ${account.username}`}
                                title="Xóa người dùng"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredAndPaginatedUsers.totalPages > 1 && (
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", color: "#7f8c9a" }}>
                Trang {currentPage} / {filteredAndPaginatedUsers.totalPages}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="admin-btn is-secondary"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  className="admin-btn is-secondary"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(filteredAndPaginatedUsers.totalPages, prev + 1)
                    )
                  }
                  disabled={
                    currentPage === filteredAndPaginatedUsers.totalPages
                  }
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="admin-card">
          <header>
            <h2>
              <FaUsersCog aria-hidden="true" /> Cấu hình quyền truy cập
            </h2>
            <span>
              Bật/tắt tính năng cho từng vai trò. Quyền của quản trị hệ thống
              luôn được giữ đầy đủ.
            </span>
          </header>

          <div className="permission-table-wrapper">
            <table className="permission-table">
              <thead>
                <tr>
                  <th scope="col">Vai trò</th>
                  {featureList.map((feature) => (
                    <th
                      key={feature.key}
                      scope="col"
                      title={feature.description}
                    >
                      {feature.label}
                    </th>
                  ))}
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {permissionRoleKeys.map((roleKey) => {
                  const label = ROLE_LABELS[roleKey] || roleKey;
                  const row = permissionMatrix[roleKey] || {};
                  const isLocked = roleKey === ROLES.SYSTEM_ADMIN;
                  const isDefaultRole = [
                    ROLES.SYSTEM_ADMIN,
                    ROLES.TOURNAMENT_ADMIN,
                    ROLES.TEAM_OWNER,
                    ROLES.VIEWER,
                  ].includes(roleKey);
                  return (
                    <tr key={roleKey}>
                      <th scope="row">{label}</th>
                      {featureList.map((feature) => (
                        <td key={`${roleKey}-${feature.key}`}>
                          <label className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={Boolean(row[feature.key])}
                              onChange={() =>
                                handlePermissionToggle(roleKey, feature.key)
                              }
                              disabled={isLocked || permissionsSaving}
                              aria-label={`${label} - ${feature.label}`}
                            />
                            <span />
                          </label>
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        {!isDefaultRole && (
                          <button
                            type="button"
                            className="admin-btn is-danger is-small"
                            onClick={() => handleDeleteRole(roleKey, label)}
                            disabled={permissionsSaving}
                            title={`Xóa vai trò "${label}"`}
                            style={{
                              padding: "0.5rem 0.75rem",
                              fontSize: "0.85rem",
                              background: "#ff6b6b",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="permission-actions">
            <button
              type="button"
              className="admin-btn is-primary"
              onClick={handleSavePermissions}
              disabled={!permissionsDirty || permissionsSaving}
            >
              {permissionsSaving ? "Đang lưu..." : "Lưu cấu hình quyền"}
            </button>
            {permissionsDirty && !permissionsSaving && (
              <>
                <button
                  type="button"
                  className="admin-btn is-secondary"
                  onClick={() => {
                    setPermissionMatrix(
                      sanitizePermissionMatrix(featurePermissions.matrix)
                    );
                    setPermissionsDirty(false);
                  }}
                >
                  Hủy
                </button>
                <span className="permission-hint">Chưa lưu thay đổi</span>
              </>
            )}
          </div>
        </section>

        {/* Role management moved into the user list header */}

        {/* Create Role Modal */}
        {showRoleModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setShowRoleModal(false)}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fb 100%)",
                borderRadius: "16px",
                boxShadow:
                  "0 25px 70px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                maxWidth: "380px",
                width: "100%",
                animation: "modalSlideIn 0.3s ease-out",
                border: "1px solid rgba(74, 144, 226, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "1rem 1.2rem",
                  background:
                    "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                  borderRadius: "16px 16px 0 0",
                  borderBottom: "3px solid #2d5a8c",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: -20,
                    width: "100px",
                    height: "100px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.2px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  ➕ Tạo vai trò mới
                </h2>
              </div>

              {/* Body */}
              <div style={{ padding: "1.2rem" }}>
                <div style={{ marginBottom: "0rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#4a90e2",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Tên vai trò
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên vai trò mới..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "2px solid #d1d8e0",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      backgroundColor: "#fafbfc",
                      color: "#1a2332",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(74, 144, 226, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d8e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "0.9rem 1.2rem",
                  background:
                    "linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%)",
                  borderTop: "2px solid #e1e8ed",
                  display: "flex",
                  gap: "0.6rem",
                  justifyContent: "flex-end",
                  borderRadius: "0 0 16px 16px",
                }}
              >
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setNewRoleName("");
                  }}
                  style={{
                    padding: "0.65rem 1.25rem",
                    border: "2px solid #d1d8e0",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#1a2332",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.borderColor = "#4a90e2";
                    e.target.style.color = "#4a90e2";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.borderColor = "#d1d8e0";
                    e.target.style.color = "#1a2332";
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateGroup}
                  style={{
                    padding: "0.65rem 1.25rem",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    background:
                      "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(74, 144, 226, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(74, 144, 226, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(74, 144, 226, 0.3)";
                  }}
                >
                  Tạo vai trò
                </button>
              </div>
            </div>

            <style>{`
              @keyframes modalSlideIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </div>
        )}
        {editingUser && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              overflow: "auto",
            }}
            onClick={() => setEditingUser(null)}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fb 100%)",
                borderRadius: "16px",
                boxShadow:
                  "0 25px 70px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                maxWidth: "460px",
                width: "100%",
                maxHeight: "auto",
                overflow: "visible",
                animation: "modalSlideIn 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "1rem 1.2rem",
                  background:
                    "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                  borderRadius: "16px 16px 0 0",
                  borderBottom: "3px solid #2d5a8c",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: -20,
                    width: "100px",
                    height: "100px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.2px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  👤 Thông tin người dùng
                </h2>
              </div>

              {/* Body */}
              <div style={{ padding: "1rem 1.2rem" }}>
                {/* Username */}
                <div style={{ marginBottom: "0.9rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#4a90e2",
                      marginBottom: "0.4rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      border: "1px solid #d1d8e0",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#f3f4f6",
                      color: "#9ca3af",
                      cursor: "not-allowed",
                      fontWeight: 500,
                    }}
                  />
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: "0.9rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#4a90e2",
                      marginBottom: "0.4rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editingUser.fullName}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        fullName: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      border: "2px solid #d1d8e0",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#fafbfc",
                      color: "#1a2332",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(74, 144, 226, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d8e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: "0.9rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#4a90e2",
                      marginBottom: "0.4rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      border: "2px solid #d1d8e0",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#fafbfc",
                      color: "#1a2332",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(74, 144, 226, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d8e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Date of Birth and Position */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.7rem",
                    marginBottom: "0.9rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#4a90e2",
                        marginBottom: "0.4rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={
                        editingUser.dob ? editingUser.dob.split("T")[0] : ""
                      }
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, dob: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem",
                        border: "2px solid #d1d8e0",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        backgroundColor: "#fafbfc",
                        color: "#1a2332",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#4a90e2";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(74, 144, 226, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d8e0";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#4a90e2",
                        marginBottom: "0.4rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Vai trò
                    </label>
                    <select
                      value={editingUser.position || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          position: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem",
                        border: "2px solid #d1d8e0",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        backgroundColor: "#fafbfc",
                        color: "#1a2332",
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#4a90e2";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(74, 144, 226, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d8e0";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {dynamicRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#e1e8ed",
                    margin: "0.8rem 0",
                  }}
                />

                {/* Password */}
                <div style={{ marginBottom: "0rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#4a90e2",
                      marginBottom: "0.4rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Đổi mật khẩu
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới..."
                    value={editingUser.newPassword}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        newPassword: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      border: "2px solid #d1d8e0",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#fafbfc",
                      color: "#1a2332",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(74, 144, 226, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d8e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <div
                    style={{
                      marginTop: "0.3rem",
                      fontSize: "0.75rem",
                      color: "#7f8c9a",
                      fontStyle: "italic",
                    }}
                  >
                    Để trống nếu không muốn đổi mật khẩu
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "0.9rem 1.2rem",
                  background:
                    "linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%)",
                  borderTop: "2px solid #e1e8ed",
                  display: "flex",
                  gap: "0.6rem",
                  justifyContent: "flex-end",
                  borderRadius: "0 0 16px 16px",
                }}
              >
                <button
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    border: "2px solid #d1d8e0",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#1a2332",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.borderColor = "#b1b7c0";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.borderColor = "#d1d8e0";
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateUserInfo}
                  style={{
                    padding: "0.65rem 1.25rem",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    background:
                      "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(74, 144, 226, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(74, 144, 226, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(74, 144, 226, 0.3)";
                  }}
                >
                  Cập nhật
                </button>
              </div>
            </div>

            <style>{`
              @keyframes modalSlideIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./AdminPanels.css";
import { FaUsersCog, FaTrash, FaUserShield, FaSyncAlt } from "react-icons/fa";
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
      const normalized = (response.data || []).map((item) => ({
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
    setPermissionMatrix(sanitizePermissionMatrix(featurePermissions.matrix));
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
    if (!ROLE_LABELS[normalizedRole]) {
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

  const featureList =
    featurePermissions.features && featurePermissions.features.length > 0
      ? featurePermissions.features
      : FEATURE_DEFINITIONS;

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

        <ul className="admin-summary" role="list">
          <li className="admin-summary-item">
            <span className="admin-summary-label">Tổng tài khoản</span>
            <strong className="admin-summary-value">{totalUsers}</strong>
            <span className="admin-summary-hint">
              Số lượng người dùng hiện có
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Quản trị viên</span>
            <strong className="admin-summary-value">{adminUsers}</strong>
            <span className="admin-summary-hint">
              Số tài khoản có quyền admin
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Người dùng chuẩn</span>
            <strong className="admin-summary-value">{normalUsers}</strong>
            <span className="admin-summary-hint">
              Bao gồm cầu thủ & cộng tác viên
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Loại quyền hạn</span>
            <strong className="admin-summary-value">{distinctRoles}</strong>
            <span className="admin-summary-hint">
              Số vai trò đang được sử dụng
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
              <FaUsersCog aria-hidden="true" /> Danh sách người dùng
            </h2>
            <span>
              Thay đổi quyền hạn hoặc xóa tài khoản không còn sử dụng.
            </span>
          </header>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên đăng nhập</th>
                  <th>Quyền hạn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="admin-empty-state">
                        Chưa có tài khoản nào.
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((account) => {
                    const normalizedRole = resolveRole(account.role);
                    const isLocked = account.username === "admin";
                    const isSystemAdmin = normalizedRole === ROLES.SYSTEM_ADMIN;
                    const roleLabel =
                      ROLE_LABELS[normalizedRole] || normalizedRole;
                    return (
                      <tr key={account.id}>
                        <td>
                          <div className="admin-inline">
                            <span>{account.username}</span>
                            {isSystemAdmin && (
                              <span className="admin-badge">
                                <FaUserShield aria-hidden="true" /> {roleLabel}
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
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn is-danger is-icon admin-icon-btn"
                            onClick={() =>
                              handleDeleteUser(account.id, account.username)
                            }
                            disabled={isLocked}
                            aria-label={`Xóa người dùng ${account.username}`}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
                </tr>
              </thead>
              <tbody>
                {PERMISSION_ROLE_ORDER.map((roleKey) => {
                  const label = ROLE_LABELS[roleKey] || roleKey;
                  const row = permissionMatrix[roleKey] || {};
                  const isLocked = roleKey === ROLES.SYSTEM_ADMIN;
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
              <span className="permission-hint">Chưa lưu thay đổi</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserManagement;

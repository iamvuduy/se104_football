import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./AdminPanels.css";
import { FaUsersCog, FaTrash, FaUserShield, FaSyncAlt } from "react-icons/fa";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setToast("");

    try {
      const response = await axios.get("/api/users");
      setUsers(response.data || []);
    } catch (_err) {
      setError(
        "Không thể tải danh sách người dùng. Có thể bạn thiếu quyền truy cập."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setToast("");
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
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

  const totalUsers = useMemo(() => users.length, [users]);
  const adminUsers = useMemo(
    () => users.filter((user) => user.role === "admin").length,
    [users]
  );
  const normalUsers = useMemo(
    () => totalUsers - adminUsers,
    [totalUsers, adminUsers]
  );
  const distinctRoles = useMemo(
    () => Array.from(new Set(users.map((user) => user.role))).length,
    [users]
  );

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
                  users.map((user) => {
                    const isLocked = user.username === "admin";
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-inline">
                            <span>{user.username}</span>
                            {user.role === "admin" && (
                              <span className="admin-badge">
                                <FaUserShield aria-hidden="true" /> Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-select"
                            value={user.role}
                            onChange={(event) =>
                              handleRoleChange(user.id, event.target.value)
                            }
                            disabled={isLocked}
                            aria-label={`Thay đổi quyền hạn cho ${user.username}`}
                          >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn is-danger is-icon admin-icon-btn"
                            onClick={() =>
                              handleDeleteUser(user.id, user.username)
                            }
                            disabled={isLocked}
                            aria-label={`Xóa người dùng ${user.username}`}
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
      </div>
    </div>
  );
};

export default UserManagement;

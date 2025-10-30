import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./TeamList.css";

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [status, setStatus] = useState(null);
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const fetchTeams = useCallback(async () => {
    if (!token) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeams(response.data.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đội bóng.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [teams]);

  const handleDeleteTeam = async (team) => {
    if (!isAdmin || !team?.id) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá đội "${team.name || "Không tên"}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(team.id);
      setStatus(null);
      await axios.delete(`/api/teams/${team.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTeams((prev) => prev.filter((item) => item.id !== team.id));
      setStatus({
        type: "success",
        message: `Đã xoá thành công đội "${team.name || "Không tên"}".`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Có lỗi xảy ra khi xoá đội bóng. Vui lòng thử lại.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDismissStatus = () => setStatus(null);

  if (loading) {
    return (
      <div className="team-dashboard team-loading-state">
        <div className="team-loader-card">Đang tải danh sách đội bóng...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-dashboard">
        <div className="team-alert" role="alert">
          Không thể tải dữ liệu đội bóng: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="team-dashboard">
      <header className="team-hero minimal">
        <h1>Danh sách đội bóng</h1>
        <div className="team-page-actions">
          <button
            type="button"
            className="team-action ghost"
            onClick={fetchTeams}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
          <Link to="/register-team" className="team-action secondary">
            Thêm đội mới
          </Link>
        </div>
      </header>

      {!isAdmin && (
        <p className="team-help-text">
          Bạn muốn đăng ký đội bóng mới? Chọn "Thêm đội mới" để gửi thông tin
          cho ban tổ chức.
        </p>
      )}

      {status && (
        <div
          className={`team-status ${
            status.type === "error" ? "is-error" : "is-success"
          }`}
          role="status"
        >
          <span>{status.message}</span>
          <button type="button" onClick={handleDismissStatus}>
            Đóng
          </button>
        </div>
      )}

      <section className="team-list-container">
        {sortedTeams.length === 0 ? (
          <div className="team-empty-state">
            <h3>Không tìm thấy đội bóng</h3>
            <p>Chưa có đội bóng nào được hiển thị trong hệ thống.</p>
          </div>
        ) : (
          <ul className="team-list">
            {sortedTeams.map((team) => {
              const displayName = team.name?.trim() || "Đội chưa đặt tên";
              const stadium = team.home_stadium?.trim() || "Đang cập nhật";
              const playerCount = team.player_count || 0;
              const avatarLetter = displayName.charAt(0).toUpperCase();

              return (
                <li key={team.id} className="team-list-item">
                  <div className="team-list-avatar" aria-hidden="true">
                    {avatarLetter}
                  </div>
                  <div className="team-list-content">
                    <div className="team-list-heading">
                      <h3>{displayName}</h3>
                      <span className="team-list-pill">
                        {playerCount} cầu thủ
                      </span>
                    </div>
                    <p className="team-list-sub">Sân nhà: {stadium}</p>
                  </div>
                  <div className="team-list-actions">
                    <Link
                      to={`/teams/${team.id}`}
                      className="team-action primary"
                    >
                      Xem chi tiết
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to={`/teams/${team.id}/edit`}
                          className="team-action secondary"
                        >
                          Chỉnh sửa
                        </Link>
                        <button
                          type="button"
                          className="team-action danger"
                          onClick={() => handleDeleteTeam(team)}
                          disabled={deletingId === team.id}
                        >
                          {deletingId === team.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeamList;

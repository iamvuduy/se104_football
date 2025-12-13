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
  const [currentPage, setCurrentPage] = useState(1);
  const { token, user, canAccessFeature } = useAuth();
  const canManageTeams = canAccessFeature("manage_teams");
  const canRegisterTeams = canAccessFeature("register_team");
  const isTeamOwner = user?.role === "team_owner";
  const TEAMS_PER_PAGE = 6;

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
    let filtered = [...teams];

    // Team owner only sees their own team
    if (isTeamOwner && user?.team_id) {
      filtered = filtered.filter((team) => team.id === user.team_id);
    }

    return filtered.sort((a, b) => {
      const codeA = (a.team_code || "").toUpperCase();
      const codeB = (b.team_code || "").toUpperCase();
      return codeA.localeCompare(codeB, "vi", { numeric: true });
    });
  }, [teams, isTeamOwner, user?.team_id]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTeams.length / TEAMS_PER_PAGE);
  const startIndex = (currentPage - 1) * TEAMS_PER_PAGE;
  const endIndex = startIndex + TEAMS_PER_PAGE;
  const paginatedTeams = sortedTeams.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!canManageTeams || !team?.id) return;

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
        </div>
      </header>

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
          <>
            <ul className="team-list">
              {paginatedTeams.map((team) => {
                const displayName = team.name?.trim() || "Đội chưa đặt tên";
                const displayCode = team.team_code?.trim() || "CHUA_CO_MA";
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
                        <h3>
                          <span className="team-list-code">{displayCode}</span>{" "}
                          {displayName}
                        </h3>
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
                      {canManageTeams && (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="team-pagination">
                <button
                  className="team-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Trước
                </button>

                <div className="team-pagination-pages">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`team-pagination-page ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="team-pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default TeamList;

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES, resolveRole } from "../utils/roles";
import "./Home.css";

const Home = () => {
  const { user, token, canAccessFeature } = useAuth();
  const isSystemAdmin = resolveRole(user?.role) === ROLES.SYSTEM_ADMIN;
  const canManageTournament = [
    "manage_schedules",
    "manage_settings",
    "record_match_results",
  ].some((feature) => canAccessFeature(feature));
  const [overview, setOverview] = useState({
    teams: 0,
    matches: 0,
    players: 0,
    goals: 0,
    users: 0,
  });
  const [topTeams, setTopTeams] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const request = (url) =>
          fetch(url, { headers: baseHeaders, signal: controller.signal });

        if (isSystemAdmin) {
          // For admin, only fetch users count
          const usersRes = await request("/api/users");
          if (!usersRes.ok) {
            throw new Error(
              "Không thể tải dữ liệu người dùng. Vui lòng thử lại."
            );
          }
          const usersData = await usersRes.json();
          const users = usersData?.data ?? [];

          if (!isMounted) {
            return;
          }

          setOverview({
            teams: 0,
            matches: 0,
            players: 0,
            goals: 0,
            users: users.length,
          });
          setTopTeams([]);
          setRecentMatches([]);
        } else {
          // For non-admin users, fetch tournament data
          const [teamsRes, resultsRes, leaderboardRes, playersRes] =
            await Promise.all([
              request("/api/teams"),
              request("/api/results"),
              request("/api/leaderboard/teams"),
              request("/api/players"),
            ]);

          if (!teamsRes.ok || !resultsRes.ok || !leaderboardRes.ok) {
            throw new Error(
              "Không thể tải dữ liệu tổng quan. Vui lòng thử lại."
            );
          }

          const teamsData = await teamsRes.json();
          const resultsData = await resultsRes.json();
          const leaderboardData = await leaderboardRes.json();
          const playersData = playersRes.ok
            ? await playersRes.json()
            : { data: [] };

          if (!isMounted) {
            return;
          }

          const teams = teamsData?.data ?? [];
          const matches = resultsData?.data ?? [];
          const leaderboard = leaderboardData?.leaderboard ?? [];
          const players = playersData?.data ?? [];

          // Calculate total goals from player stats
          const totalGoals = players.reduce(
            (sum, p) => sum + (p.totalGoals || 0),
            0
          );

          setOverview({
            teams: teams.length,
            matches: matches.length,
            players: players.length,
            goals: totalGoals,
            users: 0,
          });
          setTopTeams(leaderboard.slice(0, 3));

          // Find the match with time closest to current time
          const now = new Date();
          const sortedMatches = [...matches].sort((a, b) => {
            const dateTimeA = new Date(
              `${a.match_date?.split("T")[0] || ""}T${a.match_time || "00:00"}`
            );
            const dateTimeB = new Date(
              `${b.match_date?.split("T")[0] || ""}T${b.match_time || "00:00"}`
            );
            const diffA = Math.abs(now - dateTimeA);
            const diffB = Math.abs(now - dateTimeB);
            return diffA - diffB;
          });
          setRecentMatches(sortedMatches.slice(0, 1));
        }
      } catch (err) {
        if (!isMounted || err.name === "AbortError") {
          return;
        }
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, refreshKey, isSystemAdmin]);

  const actionLinks = useMemo(() => {
    if (isSystemAdmin) {
      // For admin, only show user management
      return [
        {
          to: "/admin/users",
          icon: "bi bi-person-gear",
          title: "Quản lý người dùng",
          description: "Phân quyền và cập nhật tài khoản hệ thống.",
          feature: "manage_users",
        },
      ];
    }

    // For non-admin users, show all relevant links
    const links = [
      {
        to: "/register-team",
        icon: "bi bi-person-plus-fill",
        title: "Đăng ký đội bóng",
        description: "Tiếp nhận hồ sơ đăng ký của các đội bóng mới.",
        feature: "register_team",
      },
      {
        to: "/teams",
        icon: "bi bi-people-fill",
        title: "Danh sách đội bóng",
        description: "Theo dõi thông tin và trạng thái của từng đội.",
        feature: "view_teams",
      },
      {
        to: "/admin/tournament-settings",
        icon: "bi bi-sliders",
        title: "Cài đặt giải đấu",
        description: "Tùy chỉnh quy định giải và áp dụng tức thì.",
        feature: "manage_settings",
      },
      {
        to: "/admin/schedules",
        icon: "bi bi-calendar-event",
        title: "Lịch thi đấu",
        description: "Lập và điều chỉnh lịch thi đấu theo từng vòng.",
        feature: "manage_schedules",
      },
      {
        to: "/record-result",
        icon: "bi bi-trophy-fill",
        title: "Ghi nhận kết quả",
        description: "Cập nhật tỉ số và thông tin bàn thắng sau mỗi trận.",
        feature: "record_match_results",
      },
      {
        to: "/match-results",
        icon: "bi bi-clipboard-data",
        title: "Kết quả trận đấu",
        description: "Tổng hợp các trận đấu đã diễn ra gần đây.",
        feature: "view_match_results",
      },
      {
        to: "/team-leaderboard",
        icon: "bi bi-bar-chart-fill",
        title: "Bảng xếp hạng",
        description: "Xem phong độ tổng quan của các đội bóng.",
        feature: "view_leaderboards",
      },
      {
        to: "/top-scorer-leaderboard",
        icon: "bi bi-award-fill",
        title: "Vua phá lưới",
        description: "Theo dõi các cầu thủ ghi bàn nhiều nhất.",
        feature: "view_leaderboards",
      },
    ];

    return links.filter((link) => canAccessFeature(link.feature));
  }, [canAccessFeature, isSystemAdmin]);

  const formatMatchDate = (value) => {
    if (!value) {
      return "Chưa cập nhật";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleReload = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="home-dashboard home-loading">
        <div className="home-loading-card">Đang tải tổng quan giải đấu...</div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      {error && (
        <div className="home-alert" role="alert" onClick={() => setError(null)}>
          {error} (bấm để ẩn)
        </div>
      )}

      {isSystemAdmin ? (
        // Compact admin header
        <header className="home-hero home-hero-compact">
          <div className="home-hero-content">
            <div className="home-hero-text">
              <span className="home-hero-badge">Bảng điều khiển quản trị</span>
              <h1>
                Chào mừng trở lại{user?.username ? `, ${user.username}` : "!"}
              </h1>
            </div>
          </div>
          <div className="home-hero-stats">
            <div className="hero-stat-card">
              <div className="hero-stat-icon is-blue">
                <i className="bi bi-people-fill" />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-label">Người dùng</span>
                <strong className="hero-stat-value">{overview.users}</strong>
              </div>
            </div>
          </div>
        </header>
      ) : (
        // Full hero for non-admin users
        <header className="home-hero">
          <div className="home-hero-content">
            <div className="home-hero-text">
              <span className="home-hero-badge">Bảng điều khiển giải đấu</span>
              <h1>
                Chào mừng trở lại{user?.username ? `, ${user.username}` : "!"}
              </h1>
              <div className="home-hero-actions">
                {canAccessFeature("view_teams") && (
                  <Link to="/teams" className="home-hero-button is-primary">
                    Xem danh sách đội
                  </Link>
                )}
                {canAccessFeature("view_leaderboards") && (
                  <Link
                    to="/team-leaderboard"
                    className="home-hero-button is-ghost"
                  >
                    Xem bảng xếp hạng
                  </Link>
                )}
                <button
                  type="button"
                  className="home-hero-button is-ghost"
                  onClick={handleReload}
                >
                  <i className="bi bi-arrow-repeat" /> Tải lại dữ liệu
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid Inside Hero */}
          <div className="home-hero-stats">
            <div className="hero-stat-card">
              <div className="hero-stat-icon is-blue">
                <i className="bi bi-people-fill" />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-label">Đội bóng</span>
                <strong className="hero-stat-value">{overview.teams}</strong>
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="hero-stat-icon is-purple">
                <i className="bi bi-person-fill" />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-label">Cầu thủ</span>
                <strong className="hero-stat-value">{overview.players}</strong>
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="hero-stat-icon is-green">
                <i className="bi bi-flag-fill" />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-label">Trận đấu</span>
                <strong className="hero-stat-value">{overview.matches}</strong>
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="hero-stat-icon is-orange">
                <i className="bi bi-bullseye" />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-label">Bàn thắng</span>
                <strong className="hero-stat-value">{overview.goals}</strong>
              </div>
            </div>
          </div>
        </header>
      )}

      <section className="home-actions">
        <div className="home-section-head">
          <h2>Truy cập nhanh</h2>
        </div>
        <div className="action-grid">
          {actionLinks.map((link) => (
            <Link key={link.to} to={link.to} className="action-card">
              <div className="action-icon">
                <i className={link.icon} />
              </div>
              <div className="action-body">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
              <span className="action-chevron">
                <i className="bi bi-arrow-right" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-data">
        <div className="data-panels">
          {!isSystemAdmin && (
            <>
              {canAccessFeature("view_leaderboards") && (
                <article className="home-panel">
                  <div className="panel-head">
                    <h2>BXH</h2>
                    <Link to="/team-leaderboard">Xem bảng đầy đủ</Link>
                  </div>
                  {topTeams.length === 0 ? (
                    <div className="home-empty">
                      Chưa có dữ liệu bảng xếp hạng.
                    </div>
                  ) : (
                    <ul className="top-team-list">
                      {topTeams.map((team, index) => (
                        <li key={team.id} className="top-team-item">
                          <span className="top-team-rank">#{index + 1}</span>
                          <div className="top-team-info">
                            <span className="top-team-name">{team.name}</span>
                            <span className="top-team-meta">
                              {team.pts} điểm • HS {team.gd}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )}

              {canAccessFeature("view_match_results") && (
                <article className="home-panel">
                  <div className="panel-head">
                    <h2>Trận đấu gần nhất</h2>
                    <Link to="/match-results">Xem tất cả</Link>
                  </div>
                  {recentMatches.length === 0 ? (
                    <div className="home-empty">
                      Chưa có trận đấu nào được ghi nhận.
                    </div>
                  ) : (
                    <ul className="match-list">
                      {recentMatches.map((match) => (
                        <li key={match.id} className="match-item">
                          <div className="match-overview">
                            <span className="match-teams">
                              <i
                                className="bi bi-people-fill"
                                style={{ marginRight: "0.5rem", opacity: 0.7 }}
                              />
                              {match.team1_name}{" "}
                              <span className="match-score">{match.score}</span>{" "}
                              {match.team2_name}
                            </span>
                            <span className="match-meta">
                              <i
                                className="bi bi-calendar-event"
                                style={{ marginRight: "0.35rem" }}
                              />
                              {formatMatchDate(match.match_date)} •{" "}
                              {match.match_time || "00:00"}
                            </span>
                            <span className="match-venue">
                              <i
                                className="bi bi-geo-alt-fill"
                                style={{ marginRight: "0.35rem" }}
                              />
                              {match.stadium || "Sân đang cập nhật"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

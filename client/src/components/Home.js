import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const Home = () => {
  const { user, token, canAccessFeature } = useAuth();
  const canManageTournament = [
    "manage_schedules",
    "manage_groups",
    "manage_settings",
    "record_match_results",
  ].some((feature) => canAccessFeature(feature));
  const [overview, setOverview] = useState({ groups: 0, teams: 0, matches: 0 });
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

        const [teamsRes, groupsRes, resultsRes, leaderboardRes] =
          await Promise.all([
            request("/api/teams"),
            request("/api/groups"),
            request("/api/results"),
            request("/api/leaderboard/teams"),
          ]);

        if (
          !teamsRes.ok ||
          !groupsRes.ok ||
          !resultsRes.ok ||
          !leaderboardRes.ok
        ) {
          throw new Error("Không thể tải dữ liệu tổng quan. Vui lòng thử lại.");
        }

        const teamsData = await teamsRes.json();
        const groupsData = await groupsRes.json();
        const resultsData = await resultsRes.json();
        const leaderboardData = await leaderboardRes.json();

        if (!isMounted) {
          return;
        }

        const teams = teamsData?.data ?? [];
        const groups = groupsData?.groups ?? [];
        const matches = resultsData?.data ?? [];
        const leaderboard = Array.isArray(leaderboardData)
          ? leaderboardData
          : [];

        setOverview({
          groups: groups.length,
          teams: teams.length,
          matches: matches.length,
        });
        setTopTeams(leaderboard.slice(0, 3));
        setRecentMatches(matches.slice(0, 4));
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
  }, [token, refreshKey]);

  const actionLinks = useMemo(() => {
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
      {
        to: "/admin/users",
        icon: "bi bi-person-gear",
        title: "Quản lý người dùng",
        description: "Phân quyền và cập nhật tài khoản hệ thống.",
        feature: "manage_users",
      },
    ];

    return links.filter((link) => canAccessFeature(link.feature));
  }, [canAccessFeature]);

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

      <header className="home-hero">
        <div className="home-hero-text">
          <span className="home-hero-badge">
            {canManageTournament
              ? "Bảng điều khiển quản trị"
              : "Bảng điều khiển giải đấu"}
          </span>
          <h1>
            Chào mừng trở lại{user?.username ? `, ${user.username}` : "!"}
          </h1>
          <p>
            Theo dõi tiến độ giải đấu, cập nhật nhanh các kết quả và truy cập
            các chức năng quan trọng chỉ với một cú nhấp chuột.
          </p>
          <div className="home-hero-actions">
            {canAccessFeature("manage_groups") && (
              <Link
                to="/admin/group-management"
                className="home-hero-button is-primary"
              >
                Quản lý bảng đấu
              </Link>
            )}
            {canAccessFeature("view_teams") && (
              <Link
                to="/teams"
                className={`home-hero-button ${
                  canManageTournament ? "is-ghost" : "is-primary"
                }`}
              >
                Xem danh sách đội
              </Link>
            )}
            {canAccessFeature("view_leaderboards") && !canManageTournament && (
              <Link
                to="/team-leaderboard"
                className="home-hero-button is-ghost"
              >
                Xem bảng xếp hạng
              </Link>
            )}
          </div>
        </div>
        <div className="home-hero-metrics">
          <div className="hero-metric-card">
            <span className="hero-metric-label">Đội tham gia</span>
            <strong className="hero-metric-value">{overview.teams}</strong>
          </div>
          <div className="hero-metric-card">
            <span className="hero-metric-label">Bảng đấu</span>
            <strong className="hero-metric-value">{overview.groups}</strong>
          </div>
          <div className="hero-metric-card">
            <span className="hero-metric-label">Trận đã hoàn tất</span>
            <strong className="hero-metric-value">{overview.matches}</strong>
          </div>
        </div>
      </header>

      <section className="home-overview">
        <div className="home-section-head">
          <h2>Tổng quan nhanh</h2>
          <button type="button" className="home-reload" onClick={handleReload}>
            <i className="bi bi-arrow-repeat" /> Tải lại dữ liệu
          </button>
        </div>

        <div className="overview-grid">
          <article className="overview-card">
            <div className="overview-icon is-blue">
              <i className="bi bi-people-fill" />
            </div>
            <div className="overview-body">
              <span className="overview-label">Đội bóng</span>
              <strong className="overview-value">{overview.teams}</strong>
              <p className="overview-note">
                Theo dõi thông tin, cầu thủ và trạng thái đăng ký.
              </p>
            </div>
          </article>
          <article className="overview-card">
            <div className="overview-icon is-purple">
              <i className="bi bi-grid-3x3-gap-fill" />
            </div>
            <div className="overview-body">
              <span className="overview-label">Bảng đấu</span>
              <strong className="overview-value">{overview.groups}</strong>
              <p className="overview-note">
                Sắp xếp đội hợp lý để đảm bảo giải diễn ra cân bằng.
              </p>
            </div>
          </article>
          <article className="overview-card">
            <div className="overview-icon is-green">
              <i className="bi bi-flag-fill" />
            </div>
            <div className="overview-body">
              <span className="overview-label">Trận đấu đã ghi nhận</span>
              <strong className="overview-value">{overview.matches}</strong>
              <p className="overview-note">
                Xem lại tỉ số, sân đấu và lịch sử đối đầu.
              </p>
            </div>
          </article>
        </div>
      </section>

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
          <article className="home-panel">
            <div className="panel-head">
              <h2>BXH</h2>
              <Link to="/team-leaderboard">Xem bảng đầy đủ</Link>
            </div>
            {topTeams.length === 0 ? (
              <div className="home-empty">Chưa có dữ liệu bảng xếp hạng.</div>
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
                        {match.team1_name}{" "}
                        <span className="match-score">{match.score}</span>{" "}
                        {match.team2_name}
                      </span>
                      <span className="match-meta">
                        {formatMatchDate(match.match_date)} •{" "}
                        {match.match_time || "00:00"}
                      </span>
                    </div>
                    <span className="match-venue">
                      {match.stadium || "Sân đang cập nhật"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </div>
  );
};

export default Home;

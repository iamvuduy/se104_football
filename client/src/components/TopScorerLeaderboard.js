import React, { useState, useEffect } from "react";
import "./TopScorerLeaderboard.css";
import { useAuth } from "../context/AuthContext";

const TopScorerLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchTopScorers = async () => {
      try {
        const response = await fetch("/api/leaderboard/top-scorers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Không thể tải danh sách vua phá lưới");
        }

        const data = await response.json();
        if (isMounted) {
          setPlayers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTopScorers();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const hasTrailingPlayers = players.length > 3;

  if (loading) {
    return (
      <div
        className="top-scorer-page is-loading"
        role="status"
        aria-live="polite"
      >
        <div className="ts-spinner" />
        <p>Đang tải bảng xếp hạng vua phá lưới...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-scorer-page is-error" role="alert">
        <h1>Vua Phá Lưới</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="top-scorer-page is-empty">
        <h1>Vua Phá Lưới</h1>
        <p>Chưa có dữ liệu ghi bàn. Hãy quay lại sau khi có trận đấu.</p>
      </div>
    );
  }

  return (
    <div className="top-scorer-page">
      <div className="ts-container">
        <header className="ts-hero">
          <div>
            <span className="ts-hero-badge">Thống kê mùa giải</span>
            <h1>Vua phá lưới</h1>
            <p>
              Theo dõi những chân sút xuất sắc nhất cùng số bàn thắng cập nhật
              theo thời gian thực.
            </p>
          </div>
          <div className="ts-meta">
            <article>
              <span>Tổng cầu thủ</span>
              <strong>{players.length}</strong>
            </article>
            <article>
              <span>Bàn thắng cao nhất</span>
              <strong>{players[0]?.goals ?? 0}</strong>
            </article>
          </div>
        </header>

        <section className="ts-table-section" aria-label="Danh sách đầy đủ">
          <header className="ts-table-header">
            <div>
              <h3>Danh sách đầy đủ</h3>
              <p>
                Các vị trí còn lại được sắp xếp theo tổng số bàn thắng ghi được.
              </p>
            </div>
          </header>

          <div className="ts-table-wrapper">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Cầu thủ</th>
                  <th>Đội bóng</th>
                  <th>Loại cầu thủ</th>
                  <th>Số bàn</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player.id || `${player.player_name}-${index}`}
                    className={index < 3 ? "ts-row-highlight" : ""}
                  >
                    <td>#{index + 1}</td>
                    <td>
                      <span className="ts-name">{player.player_name}</span>
                    </td>
                    <td>{player.team_name}</td>
                    <td>
                      <span className="ts-type">{player.player_type}</span>
                    </td>
                    <td>
                      <span className="ts-goal-count">{player.goals}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasTrailingPlayers ? null : (
            <footer className="ts-table-footnote">
              <p>
                * Bảng xếp hạng cập nhật khi có thay đổi ở kết quả các trận đấu.
              </p>
            </footer>
          )}
        </section>
      </div>
    </div>
  );
};

export default TopScorerLeaderboard;

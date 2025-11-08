import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./PlayerLookup.css";

const normalizeName = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const matchesInitials = (playerName = "", query = "") => {
  if (!playerName || !query) {
    return false;
  }

  const normalizedQuery = normalizeName(query);
  const normalizedName = normalizeName(playerName);

  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
  const nameParts = normalizedName.split(/\s+/).filter(Boolean);

  if (queryParts.length === 0 || nameParts.length === 0) {
    return false;
  }

  if (queryParts.length === 1) {
    const singleQuery = queryParts[0];

    if (singleQuery.length > 1 && !normalizedQuery.includes(" ")) {
      const initials = singleQuery.split("");
      if (initials.length <= nameParts.length) {
        const sequentialMatch = initials.every((initial, index) =>
          nameParts[index]?.startsWith(initial)
        );
        if (sequentialMatch) {
          return true;
        }
      }
    }

    return nameParts.some((part) => part.startsWith(singleQuery));
  }

  let nameIndex = 0;

  for (let i = 0; i < queryParts.length; i += 1) {
    const currentQuery = queryParts[i];
    let foundMatch = false;

    while (nameIndex < nameParts.length) {
      if (nameParts[nameIndex].startsWith(currentQuery)) {
        foundMatch = true;
        nameIndex += 1;
        break;
      }
      nameIndex += 1;
    }

    if (!foundMatch) {
      return false;
    }
  }

  return true;
};

const PlayerLookup = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Vui lòng nhập tên cầu thủ.");
      setPlayers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/players?search=${encodeURIComponent(trimmedQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Không thể tra cứu cầu thủ.");
      }

      const data = await response.json();
      const fetchedPlayers = data?.data || [];
      const filteredPlayers = fetchedPlayers.filter((player) =>
        matchesInitials(player.playerName, trimmedQuery)
      );

      setPlayers(filteredPlayers);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-lookup-shell">
      <section className="player-lookup-hero">
        <h1>Tra Cứu Cầu Thủ</h1>
        <p>
          Tìm nhanh hồ sơ cầu thủ, đội bóng và thống kê bàn thắng ngay trong hệ
          thống giải đấu của bạn.
        </p>
        <div className="player-lookup-hero-meta">
          <div className="player-lookup-meta-item">
            <span className="player-lookup-meta-label">Nguồn dữ liệu</span>
            <span className="player-lookup-meta-value">Ban tổ chức</span>
          </div>
          <div className="player-lookup-meta-item">
            <span className="player-lookup-meta-label">Cập nhật</span>
            <span className="player-lookup-meta-value">
              Theo thời gian thực
            </span>
          </div>
          <div className="player-lookup-meta-item">
            <span className="player-lookup-meta-label">Bộ lọc</span>
            <span className="player-lookup-meta-value">Chữ cái đầu</span>
          </div>
        </div>
      </section>

      <section className="player-lookup-card">
        <form className="player-lookup-form" onSubmit={handleSearch}>
          <div className="player-lookup-input-group">
            <input
              type="search"
              value={query}
              placeholder="Nhập chữ cái đầu (ví dụ: N V A hoặc NVA)"
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Đang tra cứu..." : "Tra cứu"}
            </button>
          </div>
          <p className="player-lookup-hint">
            Gợi ý: nhập chữ cái đầu theo thứ tự họ - tên đệm - tên, ví dụ "N V
            A" hoặc "NVA".
          </p>
        </form>

        {loading && (
          <div className="player-lookup-loading-state">
            <span className="player-lookup-spinner" aria-hidden="true" />
            <span>Đang tra cứu dữ liệu...</span>
          </div>
        )}

        {error && <div className="player-lookup-error">{error}</div>}

        {hasSearched && !loading && (
          <div className="player-lookup-result">
            <div className="player-lookup-result-header">
              <div>
                <h2>Danh sách cầu thủ</h2>
                <p>
                  {players.length > 0
                    ? `${
                        players.length
                      } cầu thủ phù hợp với từ khóa "${query.trim()}"`
                    : "Không có cầu thủ nào trùng khớp với từ khóa"}
                </p>
              </div>
              <span className="player-lookup-result-badge">BM4</span>
            </div>

            {players.length === 0 ? (
              <div className="player-lookup-empty-card">
                <h3>Chưa có kết quả</h3>
                <p>Hãy thử lại với chữ cái đầu khác hoặc kiểm tra chính tả.</p>
              </div>
            ) : (
              <div className="player-lookup-table-wrapper">
                <table className="player-lookup-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Cầu thủ</th>
                      <th>Đội</th>
                      <th>Loại cầu thủ</th>
                      <th>Bàn thắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr key={player.id || `${player.playerName}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{player.playerName}</td>
                        <td>{player.teamName}</td>
                        <td>{player.playerType}</td>
                        <td>{player.totalGoals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlayerLookup;

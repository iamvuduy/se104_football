import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import "./PlayerLookup.css";
import { FaFilter, FaTimes } from "react-icons/fa";

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
  const [allPlayers, setAllPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayerType, setSelectedPlayerType] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load all players and teams on mount
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [playersRes, teamsRes] = await Promise.all([
          fetch("/api/players", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/teams", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!playersRes.ok) {
          throw new Error("Không thể tải danh sách cầu thủ.");
        }

        const playersData = await playersRes.json();
        setAllPlayers(playersData?.data || []);

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData?.data || []);
        }
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
        setAllPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Filter and search players
  const filteredPlayers = useMemo(() => {
    let result = [...allPlayers];

    // Filter by team
    if (selectedTeam) {
      result = result.filter((player) => player.teamName === selectedTeam);
    }

    // Filter by player type
    if (selectedPlayerType) {
      result = result.filter((player) => player.playerType === selectedPlayerType);
    }

    // Filter by search query
    if (query.trim()) {
      result = result.filter((player) =>
        matchesInitials(player.playerName, query.trim())
      );
    }

    return result;
  }, [allPlayers, selectedTeam, selectedPlayerType, query]);

  const handleClearFilters = () => {
    setSelectedTeam("");
    setSelectedPlayerType("");
    setQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedTeam || selectedPlayerType || query.trim();

  return (
    <div className="player-lookup-shell">
      <section className="player-lookup-hero">
        <h1>Tra Cứu Cầu Thủ</h1>
        <p>
          Tìm nhanh hồ sơ cầu thủ, đội bóng và thống kê bàn thắng ngay trong hệ
          thống giải đấu của bạn.
        </p>
      </section>

      <section className="player-lookup-card">
        <div className="player-lookup-filters">
          <div className="player-lookup-input-group">
            <input
              type="search"
              value={query}
              placeholder="Tìm theo tên"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="player-lookup-actions">
            <div className="filter-group">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả đội</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={selectedPlayerType}
                onChange={(e) => setSelectedPlayerType(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả loại cầu thủ</option>
                <option value="Trong nước">Trong nước</option>
                <option value="Ngoài nước">Ngoài nước</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="clear-filters-btn"
                title="Xóa bộ lọc"
              >
                <FaTimes /> Xóa lọc
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="player-lookup-loading-state">
            <span className="player-lookup-spinner" aria-hidden="true" />
            <span>Đang tải dữ liệu...</span>
          </div>
        )}

        {error && <div className="player-lookup-error">{error}</div>}

        {!loading && (
          <div className="player-lookup-result">
            <div className="player-lookup-result-header">
              <h2>
                Danh sách cầu thủ
                <span className="player-count">
                  {filteredPlayers.length > 0
                    ? `${filteredPlayers.length} cầu thủ ${
                        hasActiveFilters ? "phù hợp" : "trong hệ thống"
                      }`
                    : "Không có cầu thủ nào"}
                </span>
              </h2>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="player-lookup-empty-card">
                <h3>Không có kết quả</h3>
                <p>
                  {hasActiveFilters
                    ? "Không tìm thấy cầu thủ nào phù hợp. Hãy thử điều chỉnh bộ lọc."
                    : "Chưa có cầu thủ nào trong hệ thống."}
                </p>
              </div>
            ) : (
              <>
              <div className="player-lookup-table-wrapper">
                <table className="player-lookup-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã cầu thủ</th>
                      <th>Cầu thủ</th>
                      <th>Đội</th>
                      <th>Loại cầu thủ</th>
                      <th>Bàn thắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((player, index) => (
                      <tr key={player.id || `${player.playerName}-${index}`}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{player.playerCode || '-'}</td>
                        <td>{player.playerName}</td>
                        <td>{player.teamName}</td>
                        <td>{player.playerType}</td>
                        <td>{player.totalGoals || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {Math.ceil(filteredPlayers.length / itemsPerPage) > 1 && (
                <div className="player-pagination">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  
                  <div className="pagination-pages">
                    {Array.from({ length: Math.ceil(filteredPlayers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPlayers.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredPlayers.length / itemsPerPage)}
                  >
                    &gt;
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlayerLookup;

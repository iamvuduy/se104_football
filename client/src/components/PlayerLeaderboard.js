import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './PlayerLeaderboard.css';

const ITEMS_PER_PAGE = 10;

const PlayerLeaderboard = () => {
    const [allPlayers, setAllPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Control states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTeam, setFilterTeam] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'totalGoals', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get('/api/players')
            .then(response => {
                setAllPlayers(response.data.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch players:", err);
                setError('Không thể tải dữ liệu cầu thủ.');
                setLoading(false);
            });
    }, []);

    const uniqueTeams = useMemo(() => [
        ...new Set(allPlayers.map(p => p.teamName))
    ], [allPlayers]);

    const uniquePlayerTypes = useMemo(() => [
        ...new Set(allPlayers.map(p => p.playerType))
    ], [allPlayers]);

    const filteredAndSortedPlayers = useMemo(() => {
        let processedPlayers = [...allPlayers];

        // Filter by search term
        if (searchTerm) {
            processedPlayers = processedPlayers.filter(p => 
                p.playerName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by team
        if (filterTeam !== 'all') {
            processedPlayers = processedPlayers.filter(p => p.teamName === filterTeam);
        }

        // Filter by player type
        if (filterType !== 'all') {
            processedPlayers = processedPlayers.filter(p => p.playerType === filterType);
        }

        // Sort
        if (sortConfig.key) {
            processedPlayers.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedPlayers;
    }, [allPlayers, searchTerm, filterTeam, filterType, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedPlayers.length / ITEMS_PER_PAGE);
    const paginatedPlayers = filteredAndSortedPlayers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            // Optional: third click resets sort or cycles back to asc. We'll cycle.
            direction = 'asc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    if (loading) return <div className="container mt-4"><h4>Đang tải...</h4></div>;
    if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

    return (
        <div className="container mt-4">
            <h2>Danh Sách Cầu Thủ</h2>
            <p>Xem, tìm kiếm, và xếp hạng các cầu thủ trong giải đấu.</p>

            {/* Controls */}
            <div className="row g-3 mb-4 align-items-center">
                <div className="col-md-4">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Tìm kiếm theo tên cầu thủ..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setCurrentPage(1); }}>
                        <option value="all">Tất cả các đội</option>
                        {uniqueTeams.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                        <option value="all">Tất cả loại cầu thủ</option>
                        {uniquePlayerTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            {/* Player Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>STT</th>
                            <th onClick={() => requestSort('playerName')} className="sortable-header">
                                Cầu Thủ{getSortIndicator('playerName')}
                            </th>
                            <th onClick={() => requestSort('teamName')} className="sortable-header">
                                Đội{getSortIndicator('teamName')}
                            </th>
                            <th>Loại Cầu Thủ</th>
                            <th onClick={() => requestSort('totalGoals')} className="sortable-header">
                                Tổng Số Bàn Thắng{getSortIndicator('totalGoals')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlayers.map((player, index) => (
                            <tr key={player.id}>
                                <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                <td>{player.playerName}</td>
                                <td>{player.teamName}</td>
                                <td>{player.playerType}</td>
                                <td>{player.totalGoals}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <nav className="d-flex justify-content-center">
                    <ul className="pagination">
                        {[...Array(totalPages).keys()].map(num => (
                            <li key={num + 1} className={`page-item ${currentPage === num + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(num + 1)}>{num + 1}</button>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default PlayerLeaderboard;

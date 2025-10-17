import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastProvider'; // Import useToast
import './TeamRegistration.css';

const TeamRegistration = () => {
  const { addToast } = useToast(); // Use the toast hook

  // State for the form
  const [teamName, setTeamName] = useState('');
  const [homeStadium, setHomeStadium] = useState('');
  const [players, setPlayers] = useState([
    { name: '', dob: '', type: 'Trong nước', notes: '' },
  ]);

  // State for the history list
  const [teamHistory, setTeamHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const endOfPlayersRef = useRef(null); // Ref for auto-scrolling

  const fetchTeamHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('http://localhost:3001/api/teams');
      setTeamHistory((response.data.teams || []).slice(-5).reverse());
    } catch (error) {
      console.error("Failed to fetch team history:", error);
      addToast('error', 'Không thể tải lịch sử đội bóng.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamHistory();
  }, []);

  // Effect for auto-scrolling
  useEffect(() => {
    if (players.length > 1) {
        endOfPlayersRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [players.length]);

  const handlePlayerChange = (index, event) => {
    const values = [...players];
    values[index][event.target.name] = event.target.value;
    setPlayers(values);
  };

  const handleAddPlayer = () => {
    if (players.length < 22) {
      setPlayers([...players, { name: '', dob: '', type: 'Trong nước', notes: '' }]);
    } else {
      addToast('error', 'Số lượng cầu thủ đã đạt tối đa (22).');
    }
  };

  const handleRemovePlayer = (index) => {
    if (players.length > 1) {
      const values = [...players];
      values.splice(index, 1);
      setPlayers(values);
    } else {
      addToast('error', 'Đội bóng phải có ít nhất 1 cầu thủ.');
    }
  };

  const [errors, setErrors] = useState({}); // State for validation errors

  const validateForm = () => {
    const newErrors = {};
    const errorMessages = [];

    // Validate team name and home stadium
    if (!teamName.trim()) newErrors.teamName = true;
    if (!homeStadium.trim()) newErrors.homeStadium = true;
    if (newErrors.teamName || newErrors.homeStadium) {
        errorMessages.push('Tên đội và sân nhà không được để trống.');
    }

    // Validate player count
    if (players.length < 15 || players.length > 22) {
        errorMessages.push(`Số lượng cầu thủ phải từ 15 đến 22.`);
    }

    let foreignPlayers = 0;
    const playerErrors = [];

    players.forEach((player, index) => {
        const playerError = {};
        // Validate player name and DOB
        if (!player.name.trim()) playerError.name = true;
        if (!player.dob) playerError.dob = true;

        // Validate player age
        if (player.dob) {
            const birthYear = new Date(player.dob).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - birthYear;
            if (age < 16 || age > 40) {
                playerError.dob = true;
                if (!errorMessages.some(msg => msg.includes('sai độ tuổi'))) {
                    errorMessages.push(`Một hoặc nhiều cầu thủ sai độ tuổi (16-40).`);
                }
            }
        } else {
             if (!errorMessages.some(msg => msg.includes('thiếu ngày sinh'))) {
                errorMessages.push(`Một hoặc nhiều cầu thủ thiếu ngày sinh.`);
            }
        }
        
        if (player.type === 'Ngoài nước') {
            foreignPlayers++;
        }

        if (Object.keys(playerError).length > 0) {
            playerErrors[index] = playerError;
        }
    });

    if (playerErrors.length > 0) {
        newErrors.players = playerErrors;
    }

    // Validate foreign player count
    if (foreignPlayers > 3) {
        errorMessages.push(`Số lượng cầu thủ nước ngoài không được vượt quá 3.`);
    }

    setErrors(newErrors);
    return errorMessages;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessages = validateForm();
    
    if (validationMessages.length > 0) {
      const combinedMessage = validationMessages.join(' ');
      addToast('error', combinedMessage);
      return;
    }

    setErrors({}); // Clear errors on successful submission
    try {
      const response = await axios.post('http://localhost:3001/api/teams', {
        teamName,
        homeStadium,
        players,
      });
      addToast('success', response.data.message || 'Đăng ký đội bóng thành công!');
      setTeamName('');
      setHomeStadium('');
      setPlayers([{ name: '', dob: '', type: 'Trong nước', notes: '' }]);
      fetchTeamHistory();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
      addToast('error', `Lỗi: ${errorMessage}`);
    }
  };

  return (
    <div className="registration-container">
      <div className="row">
        {/* Form Column */}
        <div className="col-lg-8">
          <div className="registration-form-card">
            <h2 className="mb-4">Hồ Sơ Đội Bóng</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label htmlFor="teamName" className="form-label">Tên đội</label>
                  <input type="text" id="teamName" className={`form-control ${errors.teamName ? 'is-invalid' : ''}`} value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="homeStadium" className="form-label">Sân nhà</label>
                  <input type="text" id="homeStadium" className={`form-control ${errors.homeStadium ? 'is-invalid' : ''}`} value={homeStadium} onChange={(e) => setHomeStadium(e.target.value)} required />
                </div>
              </div>
              <h3 className="mt-4 mb-3">Danh sách cầu thủ</h3>
              <div className="table-responsive">
                <table className="table player-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th>Cầu Thủ</th>
                      <th>Ngày Sinh</th>
                      <th>Loại Cầu Thủ</th>
                      <th>Ghi Chú</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td><input type="text" name="name" className={`form-control ${errors.players?.[index]?.name ? 'is-invalid' : ''}`} value={player.name} onChange={(e) => handlePlayerChange(index, e)} required /></td>
                        <td><input type="date" name="dob" className={`form-control ${errors.players?.[index]?.dob ? 'is-invalid' : ''}`} value={player.dob} onChange={(e) => handlePlayerChange(index, e)} required /></td>
                        <td>
                          <select name="type" className="form-select" value={player.type} onChange={(e) => handlePlayerChange(index, e)}>
                            <option value="Trong nước">Trong nước</option>
                            <option value="Ngoài nước">Ngoài nước</option>
                          </select>
                        </td>
                        <td><input type="text" name="notes" className="form-control" value={player.notes} onChange={(e) => handlePlayerChange(index, e)} /></td>
                        <td className="text-center"><button type="button" className="btn btn-danger" onClick={() => handleRemovePlayer(index)}>✖</button></td>
                      </tr>
                    ))}
                    <tr><td style={{padding: 0}} colSpan="6"><div ref={endOfPlayersRef} /></td></tr>
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-4">
                <button type="button" className="btn btn-secondary" onClick={handleAddPlayer}>+ Thêm cầu thủ</button>
                <button type="submit" className="btn btn-primary btn-lg">Đăng ký đội bóng</button>
              </div>
            </form>
          </div>
        </div>

        {/* History Column */}
        <div className="col-lg-4">
          <div className="registration-form-card">
            <h3 className="mb-3">Lịch sử đăng ký</h3>
            {historyLoading ? (
              <p>Loading history...</p>
            ) : teamHistory.length === 0 ? (
              <p>Chưa có đội nào được đăng ký.</p>
            ) : (
              <div className="list-group list-group-flush">
                {teamHistory.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{team.name}</div>
                      <small className="text-muted">{team.home_stadium}</small>
                    </div>
                    <span className="badge bg-primary rounded-pill">{team.player_count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistration;

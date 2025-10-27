import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './RecordMatchResult.css';

const RecordMatchResult = () => {
    const [allTeams, setAllTeams] = useState([]);
    const [team1Name, setTeam1Name] = useState('');
    const [team2Name, setTeam2Name] = useState('');
    const [score, setScore] = useState('');
    const [stadium, setStadium] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [matchTime, setMatchTime] = useState('');
    const [goals, setGoals] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/teams')
            .then(response => {
                if (response.data && response.data.data) {
                    setAllTeams(response.data.data);
                }
            })
            .catch(err => {
                console.error("Failed to fetch teams:", err);
                setError('Không thể tải danh sách đội bóng.');
            });
    }, []);

    const handleAddGoal = () => {
        setGoals([...goals, { playerName: '', teamName: team1Name || '', goalType: 'A', goalTime: '' }]);
    };

    const handleRemoveGoal = (index) => {
        const newGoals = goals.filter((_, i) => i !== index);
        setGoals(newGoals);
    };

    const handleGoalChange = (index, field, value) => {
        const newGoals = [...goals];
        newGoals[index][field] = value;
        setGoals(newGoals);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!team1Name || !team2Name) {
            setError('Vui lòng chọn cả Đội 1 và Đội 2.');
            return;
        }

        if (team1Name === team2Name) {
            setError('Đội 1 và Đội 2 không được trùng nhau.');
            return;
        }

        // Validate goal times before submitting
        for (const goal of goals) {
            const time = parseInt(goal.goalTime, 10);
            if (isNaN(time) || time < 0 || time > 90) {
                setError(`Thời điểm ghi bàn không hợp lệ cho cầu thủ "${goal.playerName || 'chưa nhập tên'}". Vui lòng nhập một số từ 0 đến 90.`);
                return;
            }
        }

        const resultData = { team1Name, team2Name, score, stadium, matchDate, matchTime, goals };

        try {
            await axios.post('/api/results', resultData);
            setSuccess('Đã lưu kết quả trận đấu thành công!');
            setTeam1Name('');
            setTeam2Name('');
            setScore('');
            setStadium('');
            setMatchDate('');
            setMatchTime('');
            setGoals([]);
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            console.error("Failed to save match result:", err);
            setError(err.response?.data?.error || 'Lỗi không xác định. Vui lòng thử lại.');
        }
    };

    const availableTeamsForTeam1 = allTeams.filter(team => team.name !== team2Name);
    const availableTeamsForTeam2 = allTeams.filter(team => team.name !== team1Name);

    return (
        <div className="container mt-4 record-result-container">
            <h2>Nhập Kết Quả Thi Đấu</h2>
            <hr />

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <h4>1. Thông tin chung</h4>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="team1Name" className="form-label">Đội 1</label>
                        <select id="team1Name" className="form-select" value={team1Name} onChange={e => setTeam1Name(e.target.value)} required>
                            <option value="">Chọn Đội 1</option>
                            {availableTeamsForTeam1.map(team => (
                                <option key={team.id} value={team.name}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="team2Name" className="form-label">Đội 2</label>
                        <select id="team2Name" className="form-select" value={team2Name} onChange={e => setTeam2Name(e.target.value)} required>
                            <option value="">Chọn Đội 2</option>
                            {availableTeamsForTeam2.map(team => (
                                <option key={team.id} value={team.name}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="row">
                     <div className="col-md-6 mb-3">
                        <label htmlFor="score" className="form-label">Tỷ số</label>
                        <input type="text" id="score" className="form-control" placeholder="Ví dụ: 2-1" value={score} onChange={e => setScore(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="stadium" className="form-label">Sân</label>
                        <input type="text" id="stadium" className="form-control" value={stadium} onChange={e => setStadium(e.target.value)} />
                    </div>
                </div>
                 <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="matchDate" className="form-label">Ngày</label>
                        <input type="date" id="matchDate" className="form-control" value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="matchTime" className="form-label">Giờ</label>
                        <input type="time" id="matchTime" className="form-control" value={matchTime} onChange={e => setMatchTime(e.target.value)} required />
                    </div>
                </div>

                <h4 className="mt-4">2. Danh sách bàn thắng</h4>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Cầu Thủ</th>
                            <th>Đội</th>
                            <th>Loại Bàn Thắng</th>
                            <th>Thời Điểm (phút)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {goals.map((goal, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <input type="text" className="form-control" value={goal.playerName} onChange={e => handleGoalChange(index, 'playerName', e.target.value)} required />
                                </td>
                                <td>
                                    <select className="form-select" value={goal.teamName} onChange={e => handleGoalChange(index, 'teamName', e.target.value)} required>
                                        <option value="">Chọn đội</option>
                                        {team1Name && <option value={team1Name}>{team1Name}</option>}
                                        {team2Name && <option value={team2Name}>{team2Name}</option>}
                                    </select>
                                </td>
                                <td>
                                    <select className="form-select" value={goal.goalType} onChange={e => handleGoalChange(index, 'goalType', e.target.value)} required>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        inputMode="numeric" 
                                        pattern="[0-9]*"
                                        className="form-control" 
                                        value={goal.goalTime} 
                                        onChange={e => handleGoalChange(index, 'goalTime', e.target.value)} 
                                        required 
                                    />
                                </td>
                                <td className="text-center">
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveGoal(index)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="btn btn-primary" onClick={handleAddGoal}>Thêm bàn thắng</button>

                <hr className="my-4" />

                <button type="submit" className="btn btn-success btn-lg">Lưu Kết Quả</button>
            </form>
        </div>
    );
};

export default RecordMatchResult;

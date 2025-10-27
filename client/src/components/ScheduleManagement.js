import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeamRegistration.css';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const ScheduleManagement = () => {
    const { token } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [teams, setTeams] = useState([]);
    const [form, setForm] = useState({
        round: '',
        matchOrder: '',
        team1_id: '',
        team2_id: '',
        date: '',
        time: '',
        stadium: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (token) {
            fetchSchedules();
            fetchTeams();
        }
    }, [token]);

    const fetchSchedules = async () => {
        try {
            const res = await axios.get('/api/schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(res.data.data);
        } catch (error) {
            console.error('Error fetching schedules', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await axios.get('/api/teams', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(res.data.data);
        } catch (error) {
            console.error('Error fetching teams', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newForm = { ...form, [name]: value };

        if (name === 'team1_id') {
            if (value) {
                const selectedTeam = teams.find(team => team.id === parseInt(value));
                if (selectedTeam) {
                    newForm.stadium = selectedTeam.home_stadium;
                }
            } else {
                newForm.stadium = ''; // Reset stadium if no team is selected
            }
        }

        setForm(newForm);
    };

    const resetForm = () => {
        setForm({
            round: '',
            matchOrder: '',
            team1_id: '',
            team2_id: '',
            date: '',
            time: '',
            stadium: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/schedules/${editingId}` : '/api/schedules';
        const method = editingId ? 'put' : 'post';

        try {
            await axios[method](url, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSchedules();
            resetForm();
        } catch (error) {
            console.error(`Error ${editingId ? 'updating' : 'creating'} schedule`, error);
        }
    };

    const handleEdit = (schedule) => {
        setForm({
            round: schedule.round,
            matchOrder: schedule.matchOrder,
            team1_id: schedule.team1_id,
            team2_id: schedule.team2_id,
            date: new Date(schedule.date).toISOString().split('T')[0],
            time: schedule.time,
            stadium: schedule.stadium
        });
        setEditingId(schedule.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) {
            try {
                await axios.delete(`/api/schedules/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchSchedules();
            } catch (error) {
                console.error('Error deleting schedule', error);
            }
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-form-card mb-4">
                <h3 className="mb-3"><FaCalendarAlt /> {editingId ? 'Chỉnh sửa lịch đấu' : 'Lập lịch thi đấu'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <input name="round" className="form-control" value={form.round} onChange={handleChange} placeholder="Vòng thi đấu" required />
                        </div>
                        <div className="col-md-4">
                            <input name="matchOrder" className="form-control" value={form.matchOrder} onChange={handleChange} placeholder="STT trận" type="text" inputMode="numeric" pattern="[0-9]*" required />
                        </div>
                        <div className="col-md-4">
                            <input name="stadium" className="form-control" value={form.stadium} onChange={handleChange} placeholder="Sân" required readOnly />
                        </div>
                        <div className="col-md-6">
                            <select name="team1_id" className="form-select" value={form.team1_id} onChange={handleChange} required>
                                <option value="">Chọn đội 1</option>
                                {teams && teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <select name="team2_id" className="form-select" value={form.team2_id} onChange={handleChange} required>
                                <option value="">Chọn đội 2</option>
                                {teams && teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <input name="date" className="form-control" value={form.date} onChange={handleChange} type="date" required />
                        </div>
                        <div className="col-md-6">
                            <input name="time" className="form-control" value={form.time} onChange={handleChange} type="time" required />
                        </div>
                    </div>
                    <div className="mt-3 d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary"><FaPlus /> {editingId ? 'Cập nhật' : 'Thêm'}</button>
                        {editingId && <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>Hủy</button>}
                    </div>
                </form>
            </div>

            <div className="registration-form-card">
                <h2 className="mb-3">Danh sách lịch thi đấu</h2>
                <div className="table-responsive">
                    <table className="table player-table">
                        <thead>
                            <tr>
                                <th>Vòng</th>
                                <th>STT</th>
                                <th>Đội 1</th>
                                <th>Đội 2</th>
                                <th>Ngày</th>
                                <th>Giờ</th>
                                <th>Sân</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules && schedules.map(schedule => (
                                <tr key={schedule.id}>
                                    <td>{schedule.round}</td>
                                    <td>{schedule.matchOrder}</td>
                                    <td>{schedule.team1}</td>
                                    <td>{schedule.team2}</td>
                                    <td>{new Date(schedule.date).toLocaleDateString('vi-VN')}</td>
                                    <td>{schedule.time}</td>
                                    <td>{schedule.stadium}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(schedule)}><FaEdit /></button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(schedule.id)}><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManagement;
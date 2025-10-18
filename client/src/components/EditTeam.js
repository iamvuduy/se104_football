import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationModal from "./NotificationModal";
import "./TeamRegistration.css";

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ isOpen: false, type: '', message: '' });

  const [teamName, setTeamName] = useState("");
  const [homeStadium, setHomeStadium] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const endOfPlayersRef = useRef(null);

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, type: '', message: '' });
    if (notification.type === 'success') {
      navigate("/teams"); // Redirect after successful update
    }
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/teams/${id}`);
        const { name, home_stadium, players } = response.data;
        setTeamName(name);
        setHomeStadium(home_stadium);
        setPlayers(players.map(p => ({ ...p, dob: p.dob.split('T')[0] }))); // Format date for input
      } catch (error) {
        console.error("Failed to fetch team data:", error);
        setNotification({ isOpen: true, type: 'error', message: 'Không thể tải dữ liệu đội bóng.' });
        navigate("/teams"); // Redirect if team not found
      } finally {
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [id, navigate]);

  useEffect(() => {
    if (players.length > 1) {
      endOfPlayersRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [players.length]);

  const handlePlayerChange = (index, event) => {
    const values = [...players];
    values[index][event.target.name] = event.target.value;
    setPlayers(values);
  };

  const handleAddPlayer = () => {
    if (players.length < 22) {
      setPlayers([...players, { name: "", dob: "", type: "Trong nước", notes: "" }]);
    } else {
      setNotification({ isOpen: true, type: 'error', message: 'Số lượng cầu thủ đã đạt tối đa (22).' });
    }
  };

  const handleRemovePlayer = (index) => {
    if (players.length > 1) {
      const values = [...players];
      values.splice(index, 1);
      setPlayers(values);
    } else {
      setNotification({ isOpen: true, type: 'error', message: 'Đội bóng phải có ít nhất 1 cầu thủ.' });
    }
  };

  const validateForm = () => {
    // (Implementation is the same as in TeamRegistration.js)
    // This can be refactored into a shared utility function
    const newErrors = {};
    const errorMessages = [];

    if (!teamName.trim()) newErrors.teamName = true;
    if (!homeStadium.trim()) newErrors.homeStadium = true;
    if (newErrors.teamName || newErrors.homeStadium) {
      errorMessages.push("Tên đội và sân nhà không được để trống.");
    }

    if (players.length < 15 || players.length > 22) {
      errorMessages.push(`Số lượng cầu thủ phải từ 15 đến 22.`);
    }

    let foreignPlayers = 0;
    const playerErrors = [];

    players.forEach((player, index) => {
      const playerError = {};
      if (!player.name.trim()) playerError.name = true;
      if (!player.dob) playerError.dob = true;

      if (player.dob) {
        const birthYear = new Date(player.dob).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        if (age < 16 || age > 40) {
          playerError.dob = true;
          if (!errorMessages.some((msg) => msg.includes("sai độ tuổi"))) {
            errorMessages.push(`Một hoặc nhiều cầu thủ sai độ tuổi (16-40).`);
          }
        }
      } else {
        if (!errorMessages.some((msg) => msg.includes("thiếu ngày sinh"))) {
          errorMessages.push(`Một hoặc nhiều cầu thủ thiếu ngày sinh.`);
        }
      }

      if (player.type === "Ngoài nước") {
        foreignPlayers++;
      }

      if (Object.keys(playerError).length > 0) {
        playerErrors[index] = playerError;
      }
    });

    if (playerErrors.length > 0) {
      newErrors.players = playerErrors;
    }

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
      setNotification({ isOpen: true, type: 'error', message: validationMessages.join(" ") });
      return;
    }

    setErrors({});
    try {
      await axios.put(`http://localhost:3001/api/teams/${id}`, {
        teamName,
        homeStadium,
        players,
      });
      setNotification({ isOpen: true, type: 'success', message: 'Cập nhật đội bóng thành công!' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
      setNotification({ isOpen: true, type: 'error', message: `Lỗi: ${errorMessage}` });
    }
  };

  if (loading) {
    return <p>Loading team data...</p>;
  }

  return (
    <div className="registration-container">
      <NotificationModal 
        isOpen={notification.isOpen} 
        type={notification.type} 
        message={notification.message} 
        onClose={handleCloseNotification} 
      />
      <div className="registration-form-card" style={{ maxWidth: '1000px', margin: 'auto' }}>
        <h2 className="mb-4">Chỉnh Sửa Hồ Sơ Đội Bóng</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="teamName" className="form-label">Tên đội</label>
              <input
                type="text"
                id="teamName"
                className={`form-control ${errors.teamName ? "is-invalid" : ""}`}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="homeStadium" className="form-label">Sân nhà</label>
              <input
                type="text"
                id="homeStadium"
                className={`form-control ${errors.homeStadium ? "is-invalid" : ""}`}
                value={homeStadium}
                onChange={(e) => setHomeStadium(e.target.value)}
                required
              />
            </div>
          </div>

          <h3 className="mt-4 mb-3">Danh sách cầu thủ</h3>
          <div className="table-responsive">
            <table className="table player-table">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th>Cầu Thủ</th>
                  <th>Ngày Sinh</th>
                  <th>Loại Cầu Thủ</th>
                  <th>Ghi Chú</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id || index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.players?.[index]?.name ? "is-invalid" : ""}`}
                        value={player.name}
                        onChange={(e) => handlePlayerChange(index, e)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="dob"
                        className={`form-control ${errors.players?.[index]?.dob ? "is-invalid" : ""}`}
                        value={player.dob}
                        onChange={(e) => handlePlayerChange(index, e)}
                        required
                      />
                    </td>
                    <td>
                      <select
                        name="type"
                        className="form-select"
                        value={player.type}
                        onChange={(e) => handlePlayerChange(index, e)}
                      >
                        <option value="Trong nước">Trong nước</option>
                        <option value="Ngoài nước">Ngoài nước</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="notes"
                        className="form-control"
                        value={player.notes}
                        onChange={(e) => handlePlayerChange(index, e)}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleRemovePlayer(index)}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: 0 }} colSpan="6">
                    <div ref={endOfPlayersRef} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddPlayer}
            >
              + Thêm cầu thủ
            </button>
            <button type="submit" className="btn btn-primary btn-lg">
              Cập nhật đội bóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeam;
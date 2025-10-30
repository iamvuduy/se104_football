import React, { useState, useEffect } from "react";
import "./RecordMatchResult.css";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationModal from "./NotificationModal";

const RecordMatchResult = () => {
  const { token } = useAuth(); // Get the auth token
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // 'success' or 'error'

  const [matchInfo, setMatchInfo] = useState({
    team1: "",
    team2: "",
    score: "",
    stadium: "",
    date: "",
    time: "",
  });

  const [teams, setTeams] = useState([]);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);

  useEffect(() => {
    if (token) {
      // Only fetch if token is available
      // Fetch all teams
      fetch("/api/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message === "success") {
            setTeams(data.data);
          }
        })
        .catch((err) => console.error("Error fetching teams:", err));
    }
  }, [token]); // Rerun effect if token changes

  const fetchPlayers = (teamId, teamNumber) => {
    if (!teamId || !token) return;
    fetch(`/api/teams/${teamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (teamNumber === 1) {
          setTeam1Players(data.players || []);
        } else {
          setTeam2Players(data.players || []);
        }
      })
      .catch((err) =>
        console.error(`Error fetching players for team ${teamId}:`, err)
      );
  };

  const [goals, setGoals] = useState([
    { player: "", team: "", type: "A", time: "" },
  ]);

  const handleMatchInfoChange = (e) => {
    const { name, value } = e.target;
    const newMatchInfo = { ...matchInfo, [name]: value };

    if (name === "team1") {
      fetchPlayers(value, 1);
      const selectedTeam = teams.find((t) => t.id === parseInt(value));
      if (selectedTeam) {
        newMatchInfo.stadium = selectedTeam.home_stadium;
      }
    } else if (name === "team2") {
      fetchPlayers(value, 2);
    }

    setMatchInfo(newMatchInfo);
  };

  const handleGoalChange = (index, e) => {
    const newGoals = [...goals];
    newGoals[index][e.target.name] = e.target.value;
    setGoals(newGoals);
  };

  const handleAddGoal = () => {
    setGoals([...goals, { player: "", team: "", type: "A", time: "" }]);
  };

  const handleRemoveGoal = (index) => {
    const newGoals = [...goals];
    newGoals.splice(index, 1);
    setGoals(newGoals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !matchInfo.team1 ||
      !matchInfo.team2 ||
      !matchInfo.score ||
      !matchInfo.stadium ||
      !matchInfo.date ||
      !matchInfo.time
    ) {
      setModalMessage("Vui lòng điền đầy đủ thông tin trận đấu.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // Validate score format and number of goals
    const scoreParts = matchInfo.score.split('-').map(s => parseInt(s.trim(), 10));
    if (scoreParts.length !== 2 || isNaN(scoreParts[0]) || isNaN(scoreParts[1])) {
      setModalMessage("Tỷ số không hợp lệ. Vui lòng nhập theo định dạng 'X-Y'.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    const totalGoalsInScore = scoreParts[0] + scoreParts[1];
    if (totalGoalsInScore !== goals.length) {
      setModalMessage(`Tỷ số là ${matchInfo.score} (${totalGoalsInScore} bàn), nhưng bạn đã nhập ${goals.length} bàn thắng. Vui lòng kiểm tra lại.`);
      setModalType("error");
      setShowModal(true);
      return;
    }

    if (
      goals.some(
        (goal) => !goal.player || !goal.team || !goal.type || goal.time === ""
      )
    ) {
      setModalMessage("Vui lòng điền đầy đủ thông tin cho tất cả các bàn thắng đã nhập.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchInfo, goals }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalMessage("Kết quả trận đấu đã được lưu thành công!");
        setModalType("success");
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          navigate("/match-results"); // Redirect to a match results page or similar
        }, 2000);
      } else {
        setModalMessage(
          data.message || "Đã xảy ra lỗi khi lưu kết quả trận đấu."
        );
        setModalType("error");
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error submitting match result:", error);
      setModalMessage("Đã xảy ra lỗi mạng hoặc máy chủ.");
      setModalType("error");
      setShowModal(true);
    }
  };

  const team1Options = teams.filter((t) => t.id !== parseInt(matchInfo.team2));
  const team2Options = teams.filter((t) => t.id !== parseInt(matchInfo.team1));

  const selectedTeams = teams.filter(
    (t) =>
      t.id === parseInt(matchInfo.team1) || t.id === parseInt(matchInfo.team2)
  );

  return (
    <div className="registration-container">
      <div className="registration-form-card">
        <h3 className="mb-4">Ghi nhận kết quả trận đấu</h3>
        <form onSubmit={handleSubmit}>
          {/* Part A: Match Information */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="team1" className="form-label">
                Đội 1 (Sân nhà)
              </label>
              <select
                id="team1"
                name="team1"
                className="form-select"
                value={matchInfo.team1}
                onChange={handleMatchInfoChange}
              >
                <option value="">Chọn đội</option>
                {team1Options.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="team2" className="form-label">
                Đội 2
              </label>
              <select
                id="team2"
                name="team2"
                className="form-select"
                value={matchInfo.team2}
                onChange={handleMatchInfoChange}
              >
                <option value="">Chọn đội</option>
                {team2Options.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="score" className="form-label">
                Tỷ số
              </label>
              <input
                type="text"
                id="score"
                name="score"
                className="form-control"
                value={matchInfo.score}
                onChange={handleMatchInfoChange}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="stadium" className="form-label">
                Sân
              </label>
              <input
                type="text"
                id="stadium"
                name="stadium"
                className="form-control"
                value={matchInfo.stadium}
                onChange={handleMatchInfoChange}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="date" className="form-label">
                Ngày
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-control"
                value={matchInfo.date}
                onChange={handleMatchInfoChange}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="time" className="form-label">
                Giờ
              </label>
              <input
                type="time"
                id="time"
                name="time"
                className="form-control"
                value={matchInfo.time}
                onChange={handleMatchInfoChange}
              />
            </div>
          </div>

          {/* Part B: Goals Table */}
          <h4 className="mb-3">Danh sách bàn thắng</h4>
          <div className="table-responsive">
            <table className="table player-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Đội</th>
                  <th>Cầu Thủ</th>
                  <th>Loại Bàn Thắng</th>
                  <th>Thời Điểm</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        name="team"
                        className="form-select"
                        value={goal.team}
                        onChange={(e) => handleGoalChange(index, e)}
                      >
                        <option value="">Chọn đội</option>
                        {selectedTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        name="player"
                        className="form-select"
                        value={goal.player}
                        onChange={(e) => handleGoalChange(index, e)}
                      >
                        <option value="">Chọn cầu thủ</option>
                        {(goal.team === matchInfo.team1
                          ? team1Players
                          : team2Players
                        ).map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        name="type"
                        className="form-select"
                        value={goal.type}
                        onChange={(e) => handleGoalChange(index, e)}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        name="time"
                        className="form-control"
                        min="0"
                        max="90"
                        value={goal.time}
                        onChange={(e) => handleGoalChange(index, e)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleRemoveGoal(index)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={handleAddGoal}
          >
            <FaPlus /> Thêm bàn thắng
          </button>

          <div className="mt-4 d-flex justify-content-end">
            <button type="submit" className="btn btn-primary">
              Lưu kết quả
            </button>
          </div>
        </form>
      </div>
      <NotificationModal
        isOpen={showModal}
        message={modalMessage}
        type={modalType}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default RecordMatchResult;
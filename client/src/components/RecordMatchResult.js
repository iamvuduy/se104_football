import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./AdminPanels.css";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationModal from "./NotificationModal";

const RecordMatchResult = () => {
  const { token, canAccessFeature } = useAuth();
  const canRecordResults = canAccessFeature("record_match_results");
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // 'success' or 'error'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  const [settings, setSettings] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!token || !canRecordResults) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };

    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        const [teamRes, settingsRes] = await Promise.all([
          fetch("/api/teams", { headers, signal: controller.signal }),
          fetch("/api/settings", { headers, signal: controller.signal }),
        ]);

        if (!active) {
          return;
        }

        if (!teamRes.ok) {
          throw new Error("Không thể tải danh sách đội bóng.");
        }
        if (!settingsRes.ok) {
          throw new Error("Không thể tải quy định bàn thắng.");
        }

        const teamData = await teamRes.json();
        const settingsData = await settingsRes.json();

        if (teamData.message === "success") {
          setTeams(teamData.data || []);
        }
        if (settingsData.message === "success") {
          setSettings(settingsData.data || null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu ban đầu.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, canRecordResults]);

  const fetchPlayers = useCallback(
    (teamId, teamNumber) => {
      if (!teamId || !token || !canRecordResults) return;
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
    },
    [token, canRecordResults]
  );

  const goalTypes = useMemo(() => {
    if (settings?.goal_types && settings.goal_types.length > 0) {
      return settings.goal_types;
    }
    return ["A", "B", "C"];
  }, [settings]);

  const goalTimeLimit = settings?.goal_time_limit ?? 90;

  useEffect(() => {
    if (!goalTypes.length) {
      setGoals([]);
      return;
    }

    setGoals((prev) => {
      if (!prev.length) {
        return [{ player: "", team: "", type: goalTypes[0], time: "" }];
      }
      return prev.map((goal) => ({
        ...goal,
        type: goalTypes.includes(goal.type) ? goal.type : goalTypes[0],
      }));
    });
  }, [goalTypes]);

  useEffect(() => {
    if (matchInfo.team1) {
      fetchPlayers(matchInfo.team1, 1);
    } else {
      setTeam1Players([]);
    }
  }, [fetchPlayers, matchInfo.team1]);

  useEffect(() => {
    if (matchInfo.team2) {
      fetchPlayers(matchInfo.team2, 2);
    } else {
      setTeam2Players([]);
    }
  }, [fetchPlayers, matchInfo.team2]);

  const handleMatchInfoChange = (e) => {
    const { name, value } = e.target;
    const newMatchInfo = { ...matchInfo, [name]: value };

    if (name === "team1") {
      const selectedTeam = teams.find((t) => t.id === parseInt(value, 10));
      if (selectedTeam) {
        newMatchInfo.stadium = selectedTeam.home_stadium;
      } else {
        newMatchInfo.stadium = "";
      }
    }

    setMatchInfo(newMatchInfo);
  };

  const handleGoalChange = (index, e) => {
    const newGoals = [...goals];
    newGoals[index][e.target.name] = e.target.value;
    setGoals(newGoals);
  };

  const handleAddGoal = () => {
    const nextType = goalTypes[0] || "";
    setGoals([...goals, { player: "", team: "", type: nextType, time: "" }]);
  };

  const handleRemoveGoal = (index) => {
    const newGoals = [...goals];
    newGoals.splice(index, 1);
    setGoals(newGoals);
  };

  const handleResetForm = () => {
    setMatchInfo({
      team1: "",
      team2: "",
      score: "",
      stadium: "",
      date: "",
      time: "",
    });
    setTeam1Players([]);
    setTeam2Players([]);
    setGoals(
      goalTypes.length
        ? [{ player: "", team: "", type: goalTypes[0], time: "" }]
        : []
    );
    setToast("");
    setError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (modalType === "success") {
      navigate("/match-results");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      return;
    }

    setToast("");
    setError("");

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
    const scoreParts = matchInfo.score
      .split("-")
      .map((s) => parseInt(s.trim(), 10));
    if (
      scoreParts.length !== 2 ||
      isNaN(scoreParts[0]) ||
      isNaN(scoreParts[1])
    ) {
      setModalMessage(
        "Tỷ số không hợp lệ. Vui lòng nhập theo định dạng 'X-Y'."
      );
      setModalType("error");
      setShowModal(true);
      return;
    }

    const totalGoalsInScore = scoreParts[0] + scoreParts[1];
    if (totalGoalsInScore !== goals.length) {
      setModalMessage(
        `Tỷ số là ${matchInfo.score} (${totalGoalsInScore} bàn), nhưng bạn đã nhập ${goals.length} bàn thắng. Vui lòng kiểm tra lại.`
      );
      setModalType("error");
      setShowModal(true);
      return;
    }

    let goalValidationError = "";
    goals.forEach((goal, idx) => {
      if (goalValidationError) {
        return;
      }
      if (!goal.player || !goal.team || !goal.type || goal.time === "") {
        goalValidationError = `Thiếu thông tin ở bàn thắng số ${idx + 1}.`;
        return;
      }
      if (goalTypes.length > 0 && !goalTypes.includes(goal.type)) {
        goalValidationError = `Loại bàn thắng ở hàng ${idx + 1} không hợp lệ.`;
        return;
      }
      const timeValue = Number(goal.time);
      if (!Number.isFinite(timeValue) || timeValue < 0) {
        goalValidationError = `Thời điểm ghi bàn ở hàng ${
          idx + 1
        } phải là số không âm.`;
        return;
      }
      if (timeValue > goalTimeLimit) {
        goalValidationError = `Thời điểm ghi bàn ở hàng ${
          idx + 1
        } vượt quá giới hạn ${goalTimeLimit} phút.`;
      }
    });

    if (goalValidationError) {
      setModalMessage(goalValidationError);
      setModalType("error");
      setShowModal(true);
      return;
    }

    setSubmitting(true);
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
        handleResetForm();
        setToast("Đã lưu kết quả trận đấu.");
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
    setSubmitting(false);
  };

  const team1Options = teams.filter(
    (t) => t.id !== parseInt(matchInfo.team2, 10)
  );
  const team2Options = teams.filter(
    (t) => t.id !== parseInt(matchInfo.team1, 10)
  );

  const selectedTeams = teams.filter(
    (t) =>
      t.id === parseInt(matchInfo.team1, 10) ||
      t.id === parseInt(matchInfo.team2, 10)
  );

  const team1Name = useMemo(() => {
    const found = teams.find(
      (team) => team.id === parseInt(matchInfo.team1, 10)
    );
    return found ? found.name : "Đội 1";
  }, [teams, matchInfo.team1]);

  const team2Name = useMemo(() => {
    const found = teams.find(
      (team) => team.id === parseInt(matchInfo.team2, 10)
    );
    return found ? found.name : "Đội 2";
  }, [teams, matchInfo.team2]);

  const goalSummary = useMemo(
    () =>
      goals.reduce(
        (acc, goal) => {
          if (goal.team === matchInfo.team1) {
            acc.team1 += 1;
          } else if (goal.team === matchInfo.team2) {
            acc.team2 += 1;
          }
          return acc;
        },
        { team1: 0, team2: 0 }
      ),
    [goals, matchInfo.team1, matchInfo.team2]
  );

  if (!token) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Yêu cầu đăng nhập</span>
              <h1>Ghi nhận kết quả</h1>
              <p>Bạn cần đăng nhập để tiếp tục.</p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (!canRecordResults) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Quyền hạn hạn chế</span>
              <h1>Ghi nhận kết quả</h1>
              <p>Bạn không có quyền ghi nhận kết quả trận đấu.</p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-wrapper">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-badge">Đang tải</span>
              <h1>Ghi nhận kết quả</h1>
              <p>Hệ thống đang tải danh sách đội bóng và quy định giải đấu.</p>
            </div>
          </header>
          <div className="admin-loading">Đang chuẩn bị dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-wrapper">
        <header className="admin-hero">
          <div>
            <span className="admin-hero-badge">Kết quả thi đấu</span>
            <h1>Ghi nhận kết quả</h1>
            <p>
              Cập nhật tỷ số, danh sách bàn thắng và thông tin trận đấu chỉ
              trong một bước.
            </p>
          </div>
          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-btn is-secondary"
              onClick={handleResetForm}
            >
              Làm mới biểu mẫu
            </button>
          </div>
        </header>

        <ul className="admin-summary" role="list">
          <li className="admin-summary-item">
            <span className="admin-summary-label">Loại bàn thắng</span>
            <strong className="admin-summary-value">{goalTypes.length}</strong>
            <span className="admin-summary-hint">Theo quy định hiện hành</span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Giới hạn thời điểm</span>
            <strong className="admin-summary-value">{goalTimeLimit}'</strong>
            <span className="admin-summary-hint">
              Phút tối đa được ghi nhận
            </span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Bàn thắng đội 1</span>
            <strong className="admin-summary-value">{goalSummary.team1}</strong>
            <span className="admin-summary-hint">Theo danh sách bên dưới</span>
          </li>
          <li className="admin-summary-item">
            <span className="admin-summary-label">Bàn thắng đội 2</span>
            <strong className="admin-summary-value">{goalSummary.team2}</strong>
            <span className="admin-summary-hint">Theo danh sách bên dưới</span>
          </li>
        </ul>

        {error && (
          <div
            className="admin-alert"
            onClick={() => setError("")}
            role="alert"
          >
            {error} — nhấn để ẩn.
          </div>
        )}

        {toast && (
          <div className="admin-toast" onClick={() => setToast("")}>
            {toast}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="admin-card">
            <header>
              <h2>Thông tin trận đấu</h2>
              <span>Điền thông tin trước khi ghi nhận bàn thắng.</span>
            </header>

            <div className="admin-scoreboard">
              <div className="admin-scoreboard-title">
                <span>Cặp đấu</span>
                <strong className="admin-scoreboard-value">
                  {team1Name} vs {team2Name}
                </strong>
              </div>
              <div className="admin-scoreboard-title">
                <span>Tỷ số nhập</span>
                <strong className="admin-scoreboard-value">
                  {matchInfo.score || "0-0"}
                </strong>
              </div>
              <div className="admin-scoreboard-title">
                <span>Địa điểm</span>
                <strong className="admin-scoreboard-value">
                  {matchInfo.stadium || "Chưa xác định"}
                </strong>
              </div>
            </div>

            <div className="admin-form-grid is-two-column">
              <div className="admin-field">
                <label className="admin-label" htmlFor="team1">
                  Đội 1 (sân nhà)
                </label>
                <select
                  id="team1"
                  name="team1"
                  className="admin-select"
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
              <div className="admin-field">
                <label className="admin-label" htmlFor="team2">
                  Đội 2
                </label>
                <select
                  id="team2"
                  name="team2"
                  className="admin-select"
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
              <div className="admin-field">
                <label className="admin-label" htmlFor="score">
                  Tỷ số (dạng X-Y)
                </label>
                <input
                  type="text"
                  id="score"
                  name="score"
                  className="admin-input"
                  value={matchInfo.score}
                  onChange={handleMatchInfoChange}
                  placeholder="Ví dụ: 2-1"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="stadium">
                  Sân thi đấu
                </label>
                <input
                  type="text"
                  id="stadium"
                  name="stadium"
                  className="admin-input"
                  value={matchInfo.stadium}
                  onChange={handleMatchInfoChange}
                  placeholder="Sân nhà sẽ tự gợi ý"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="date">
                  Ngày thi đấu
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="admin-input"
                  value={matchInfo.date}
                  onChange={handleMatchInfoChange}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="time">
                  Giờ thi đấu
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  className="admin-input"
                  value={matchInfo.time}
                  onChange={handleMatchInfoChange}
                />
              </div>
            </div>
          </section>

          <section className="admin-card">
            <header>
              <h2>Danh sách bàn thắng</h2>
              <span>
                Ghi nhận chi tiết từng bàn thắng, loại bàn và thời điểm.
              </span>
            </header>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Đội</th>
                    <th>Cầu thủ</th>
                    <th>Loại bàn thắng</th>
                    <th>Thời điểm (phút)</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          name="team"
                          className="admin-select"
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
                          className="admin-select"
                          value={goal.player}
                          onChange={(e) => handleGoalChange(index, e)}
                        >
                          <option value="">Chọn cầu thủ</option>
                          {(goal.team === matchInfo.team1
                            ? team1Players
                            : goal.team === matchInfo.team2
                            ? team2Players
                            : []
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
                          className="admin-select"
                          value={goal.type}
                          onChange={(e) => handleGoalChange(index, e)}
                        >
                          {goalTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          name="time"
                          className="admin-input"
                          min="0"
                          max={goalTimeLimit}
                          value={goal.time}
                          onChange={(e) => handleGoalChange(index, e)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn is-danger is-icon"
                          onClick={() => handleRemoveGoal(index)}
                          aria-label={`Xóa bàn thắng thứ ${index + 1}`}
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
              className="admin-btn is-secondary"
              style={{ marginTop: "1.25rem" }}
              onClick={handleAddGoal}
            >
              <FaPlus /> Thêm bàn thắng
            </button>
          </section>

          <div className="admin-actions">
            <button
              type="submit"
              className="admin-btn is-primary"
              disabled={submitting}
            >
              Lưu kết quả
            </button>
          </div>
        </form>
      </div>
      <NotificationModal
        isOpen={showModal}
        message={modalMessage}
        type={modalType}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default RecordMatchResult;

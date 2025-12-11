import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import "./RecordMatchResult.css"; // Reuse existing styles

const MatchForm = ({
  initialData,
  teams,
  schedules,
  settings,
  onSubmit,
  onCancel,
  isEditing = false,
  token,
}) => {
  const [matchInfo, setMatchInfo] = useState({
    matchId: "",
    team1: "",
    team2: "",
    score: "",
    stadium: "",
    date: "",
    time: "",
  });

  const [goals, setGoals] = useState([]);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [error, setError] = useState("");

  // Initialize form with initialData if provided
  useEffect(() => {
    if (initialData) {
      setMatchInfo(initialData.matchInfo);
      setGoals(initialData.goals || []);
    } else {
      // Reset if no initial data (switching to Add mode)
      setMatchInfo({
        matchId: "",
        team1: "",
        team2: "",
        score: "",
        stadium: "",
        date: "",
        time: "",
      });
      setGoals([]);
    }
  }, [initialData]);

  // Goal Types from Settings
  const goalTypes = useMemo(() => {
    if (settings?.goal_types && settings.goal_types.length > 0) {
      return settings.goal_types;
    }
    return ["A", "B", "C"];
  }, [settings]);

  const goalTimeLimit = settings?.goal_time_limit ?? 90;

  // Initialize goals if empty and not editing
  useEffect(() => {
    if (!isEditing && goals.length === 0 && goalTypes.length > 0) {
      // Optional: Pre-add one empty goal row? No, let user add it.
      // Actually original code did:
      // setGoals([{ player: "", team: "", type: goalTypes[0], time: "", goalCode: "" }]);
      // Let's keep it consistent if desired, but maybe better to start empty.
      // The original code had a useEffect that added one if empty.
      // Let's stick to: if user wants to add goal, they click add.
      // BUT, original code:
      /*
        setGoals((prev) => {
            if (!prev.length) {
                return [{ player: "", team: "", type: goalTypes[0], time: "", goalCode: "" }];
            }
            ...
        });
       */
      // I will skip auto-adding for now to be cleaner, or add one if empty?
      // Let's add one if empty ONLY for new forms.
      if (!initialData && goals.length === 0) {
        setGoals([
          { player: "", team: "", type: goalTypes[0], time: "", goalCode: "" },
        ]);
      }
    }
  }, [goalTypes, isEditing, initialData]);

  // Fetch Players
  const fetchPlayers = useCallback(
    (teamId, teamNumber) => {
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
    },
    [token]
  );

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
    let newMatchInfo = { ...matchInfo, [name]: value };

    if (name === "matchId") {
      const selectedMatch = schedules.find((m) => m.id === parseInt(value, 10));
      if (selectedMatch) {
        newMatchInfo = {
          ...newMatchInfo,
          team1: String(selectedMatch.team1_id),
          team2: String(selectedMatch.team2_id),
          date: selectedMatch.date ? selectedMatch.date.split("T")[0] : "",
          time: selectedMatch.time || "",
          stadium: selectedMatch.stadium || "",
        };
      } else {
        newMatchInfo = {
          ...newMatchInfo,
          team1: "",
          team2: "",
          date: "",
          time: "",
          stadium: "",
        };
      }
    }

    if (name === "team1") {
      const selectedTeam = teams.find((t) => t.id === parseInt(value, 10));
      if (selectedTeam && !newMatchInfo.stadium) {
        newMatchInfo.stadium = selectedTeam.home_stadium;
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
    setGoals([
      ...goals,
      { player: "", team: "", type: nextType, time: "", goalCode: "" },
    ]);
  };

  const handleRemoveGoal = (index) => {
    const newGoals = [...goals];
    newGoals.splice(index, 1);
    setGoals(newGoals);
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
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
      setError("Vui lòng điền đầy đủ thông tin trận đấu.");
      return;
    }

    const scoreParts = matchInfo.score
      .split("-")
      .map((s) => parseInt(s.trim(), 10));
    if (
      scoreParts.length !== 2 ||
      isNaN(scoreParts[0]) ||
      isNaN(scoreParts[1])
    ) {
      setError("Tỷ số không hợp lệ. Vui lòng nhập theo định dạng 'X-Y'.");
      return;
    }

    const totalGoalsInScore = scoreParts[0] + scoreParts[1];
    if (totalGoalsInScore !== goals.length) {
      setError(
        `Tỷ số là ${matchInfo.score} (${totalGoalsInScore} bàn), nhưng bạn đã nhập ${goals.length} bàn thắng.`
      );
      return;
    }

    let goalValidationError = "";
    goals.forEach((goal, idx) => {
      if (goalValidationError) return;
      if (!goal.player || !goal.team || !goal.type || goal.time === "") {
        goalValidationError = `Thiếu thông tin ở bàn thắng số ${idx + 1}.`;
        return;
      }
      const timeValue = Number(goal.time);
      if (
        !Number.isFinite(timeValue) ||
        timeValue < 0 ||
        timeValue > goalTimeLimit
      ) {
        goalValidationError = `Thời điểm ghi bàn ở hàng ${
          idx + 1
        } không hợp lệ (0-${goalTimeLimit}).`;
        return;
      }
    });

    if (goalValidationError) {
      setError(goalValidationError);
      return;
    }

    // Submit
    onSubmit(matchInfo, goals);
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

  return (
    <form onSubmit={validateAndSubmit}>
      {error && <div className="admin-alert error">{error}</div>}

      <div
        className="record-match-card"
        style={isEditing ? { boxShadow: "none", padding: 0 } : {}}
      >
        <div className="form-section">
          <h3>Thông tin trận đấu</h3>
          <div className="form-grid horizontal-layout">
            {!isEditing && (
              <div className="form-group match-code">
                <label htmlFor="matchId">Mã trận</label>
                <select
                  id="matchId"
                  name="matchId"
                  value={matchInfo.matchId}
                  onChange={handleMatchInfoChange}
                  className="form-control"
                >
                  <option value="">Chọn mã trận</option>
                  {schedules.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.match_code}
                      {match.team1_name && match.team2_name
                        ? ` - ${match.team1_name} vs ${match.team2_name}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group team-select">
              <label htmlFor="team1">Đội 1 (sân nhà)</label>
              <select
                id="team1"
                name="team1"
                value={matchInfo.team1}
                onChange={handleMatchInfoChange}
                className="form-control"
                disabled={true}
              >
                <option value="">Chọn đội</option>
                {team1Options.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group team-select">
              <label htmlFor="team2">Đội 2</label>
              <select
                id="team2"
                name="team2"
                value={matchInfo.team2}
                onChange={handleMatchInfoChange}
                className="form-control"
                disabled={true}
              >
                <option value="">Chọn đội</option>
                {team2Options.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group score-input">
              <label htmlFor="score">Tỷ số</label>
              <input
                type="text"
                id="score"
                name="score"
                value={matchInfo.score}
                onChange={handleMatchInfoChange}
                placeholder="0-0"
                className="form-control"
              />
            </div>

            <div className="form-group date-input">
              <label htmlFor="date">Ngày</label>
              <input
                type="date"
                id="date"
                name="date"
                value={matchInfo.date}
                onChange={handleMatchInfoChange}
                className="form-control"
                disabled={true}
              />
            </div>

            <div className="form-group time-input">
              <label htmlFor="time">Giờ</label>
              <input
                type="text"
                id="time"
                name="time"
                value={matchInfo.time}
                onChange={handleMatchInfoChange}
                className="form-control"
                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                placeholder="VD: 14:30"
                title="Nhập giờ theo định dạng 24 giờ (VD: 14:30)"
                disabled={true}
              />
            </div>

            <div className="form-group stadium-input">
              <label htmlFor="stadium">Sân thi đấu</label>
              <input
                type="text"
                id="stadium"
                name="stadium"
                value={matchInfo.stadium}
                onChange={handleMatchInfoChange}
                placeholder="Sân vận động"
                className="form-control"
                disabled={true}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Danh sách bàn thắng</h3>
          <div className="admin-table-wrapper">
            <table className="goals-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã bàn thắng</th>
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
                      <input
                        type="text"
                        name="goalCode"
                        className="form-control"
                        value={goal.goalCode || ""}
                        onChange={(e) => handleGoalChange(index, e)}
                        placeholder="Mã"
                        style={{ minWidth: "60px" }}
                      />
                    </td>
                    <td>
                      <select
                        name="team"
                        className="form-control"
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
                        className="form-control"
                        value={goal.player}
                        onChange={(e) => handleGoalChange(index, e)}
                      >
                        <option value="">Chọn cầu thủ</option>
                        {(parseInt(goal.team, 10) ===
                        parseInt(matchInfo.team1, 10)
                          ? team1Players
                          : parseInt(goal.team, 10) ===
                            parseInt(matchInfo.team2, 10)
                          ? team2Players
                          : []
                        ).map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.player_code
                              ? `[${player.player_code}] `
                              : ""}
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        name="type"
                        className="form-control"
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
                        className="form-control"
                        min="0"
                        max={goalTimeLimit}
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
            className="btn btn-secondary"
            style={{ marginTop: "1rem" }}
            onClick={handleAddGoal}
          >
            <FaPlus /> Thêm bàn thắng
          </button>
        </div>

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Cập nhật" : "Lưu kết quả"}
          </button>
          {isEditing && onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ marginLeft: "1rem" }}
            >
              Hủy bỏ
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default MatchForm;

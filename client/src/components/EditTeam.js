import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationModal from "./NotificationModal";
import "./TeamRegistration.css";

const TEAM_CODE_REGEX = /^FC\d{3}$/;

const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
};

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "",
    message: "",
  });

  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [homeStadium, setHomeStadium] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState(null);

  const endOfPlayersRef = useRef(null);

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, type: "", message: "" });
    if (notification.type === "success") {
      navigate("/teams"); // Redirect after successful update
    }
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await axios.get(`/api/teams/${id}`);
        const { team_code, name, home_stadium, players } = response.data;
        setTeamCode(team_code);
        setTeamName(name);
        setHomeStadium(home_stadium);
        setPlayers(players.map((p) => ({ ...p, dob: p.dob.split("T")[0] }))); // Format date for input
      } catch (error) {
        console.error("Failed to fetch team data:", error);
        setNotification({
          isOpen: true,
          type: "error",
          message: "Không thể tải dữ liệu đội bóng.",
        });
        navigate("/teams"); // Redirect if team not found
      } finally {
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [id, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/settings");
        if (isMounted) {
          setSettings(response.data?.data || null);
        }
      } catch (error) {
        console.error("Failed to fetch tournament settings:", error);
        if (isMounted) {
          setSettings(null);
        }
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const minPlayers = useMemo(
    () => Number(settings?.team_min_players) || 11,
    [settings]
  );
  const maxPlayers = useMemo(
    () => Number(settings?.team_max_players) || 25,
    [settings]
  );
  const minAge = useMemo(
    () => Number(settings?.player_min_age) || 16,
    [settings]
  );
  const maxAge = useMemo(
    () => Number(settings?.player_max_age) || 40,
    [settings]
  );
  const foreignLimit = useMemo(
    () => Number(settings?.foreign_player_limit) || 3,
    [settings]
  );

  useEffect(() => {
    if (!settings || players.length >= minPlayers) {
      return;
    }
    setPlayers((prev) => {
      if (prev.length >= minPlayers) {
        return prev;
      }
      const extras = Array.from({ length: minPlayers - prev.length }, () => ({
        name: "",
        dob: "",
        type: "Trong nước",
        notes: "",
      }));
      return [...prev, ...extras];
    });
  }, [settings, minPlayers, players.length]);

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
    if (players.length >= maxPlayers) {
      setNotification({
        isOpen: true,
        type: "error",
        message: `Số lượng cầu thủ đã đạt tối đa (${maxPlayers}).`,
      });
      return;
    }
    setPlayers([
      ...players,
      { name: "", dob: "", type: "Trong nước", notes: "" },
    ]);
  };

  const handleRemovePlayer = (index) => {
    if (players.length > minPlayers) {
      const values = [...players];
      values.splice(index, 1);
      setPlayers(values);
    } else {
      setNotification({
        isOpen: true,
        type: "error",
        message: `Đội bóng phải có ít nhất ${minPlayers} cầu thủ.`,
      });
    }
  };

  const validateForm = () => {
    // (Implementation is the same as in TeamRegistration.js)
    // This can be refactored into a shared utility function
    const newErrors = {};
    const errorMessages = [];

    const normalizedCode = teamCode.trim().toUpperCase();
    const codeEmpty = !normalizedCode;
    const nameEmpty = !teamName.trim();
    const stadiumEmpty = !homeStadium.trim();

    if (codeEmpty || !TEAM_CODE_REGEX.test(normalizedCode)) {
      newErrors.teamCode = true;
      if (!codeEmpty && !TEAM_CODE_REGEX.test(normalizedCode)) {
        errorMessages.push("Mã đội phải theo định dạng FCxxx (ví dụ: FC001).");
      }
    }

    if (codeEmpty || nameEmpty || stadiumEmpty) {
      if (codeEmpty) newErrors.teamCode = true;
      if (nameEmpty) newErrors.teamName = true;
      if (stadiumEmpty) newErrors.homeStadium = true;
      if (
        !errorMessages.includes(
          "Mã đội, tên đội và sân nhà không được để trống."
        )
      ) {
        errorMessages.push("Mã đội, tên đội và sân nhà không được để trống.");
      }
    }

    let foreignPlayers = 0;
    const playerErrors = [];
    let hasAgeError = false;
    let hasDobError = false;
    let hasNameError = false;

    players.forEach((player, index) => {
      const playerError = {};
      if (!player.name.trim()) {
        playerError.name = true;
        hasNameError = true;
      }
      if (!player.dob) playerError.dob = true;

      if (player.dob) {
        const age = calculateAge(player.dob);
        if (age === null) {
          playerError.dob = true;
          hasDobError = true;
        } else if (age < minAge || age > maxAge) {
          playerError.dob = true;
          hasAgeError = true;
        }
      } else {
        hasDobError = true;
      }

      if (player.type === "Ngoài nước") {
        foreignPlayers++;
      }

      if (Object.keys(playerError).length > 0) {
        playerErrors[index] = playerError;
      }
    });

    if (hasDobError) {
      errorMessages.push(
        "Một hoặc nhiều cầu thủ thiếu hoặc sai định dạng ngày sinh."
      );
    }

    if (hasAgeError) {
      errorMessages.push(
        `Một hoặc nhiều cầu thủ sai độ tuổi (${minAge}-${maxAge}).`
      );
    }

    if (hasNameError) {
      errorMessages.push("Tên cầu thủ không được để trống.");
    }

    if (playerErrors.length > 0) {
      newErrors.players = playerErrors;
    }

    if (players.length < minPlayers || players.length > maxPlayers) {
      errorMessages.push(
        `Số lượng cầu thủ phải từ ${minPlayers} đến ${maxPlayers}.`
      );
    }

    if (foreignPlayers > foreignLimit) {
      errorMessages.push(
        `Số lượng cầu thủ nước ngoài không được vượt quá ${foreignLimit}.`
      );
    }

    setErrors(newErrors);
    return errorMessages;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessages = validateForm();

    if (validationMessages.length > 0) {
      setNotification({
        isOpen: true,
        type: "error",
        message: validationMessages.join(" "),
      });
      return;
    }

    setErrors({});
    try {
      await axios.put(`/api/teams/${id}`, {
        teamCode,
        teamName,
        homeStadium,
        players,
      });
      setNotification({
        isOpen: true,
        type: "success",
        message: "Cập nhật đội bóng thành công!",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      setNotification({
        isOpen: true,
        type: "error",
        message: `Lỗi: ${errorMessage}`,
      });
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
      <div className="registration-form-card">
        <h3 className="mb-4">Chỉnh Sửa Hồ Sơ Đội Bóng</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="row mb-4">
            <div className="col-md-4">
              <label htmlFor="teamCode" className="form-label">
                Mã đội
              </label>
              <input
                type="text"
                id="teamCode"
                className={`form-control ${
                  errors.teamCode ? "is-invalid" : ""
                }`}
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="teamName" className="form-label">
                Tên đội
              </label>
              <input
                type="text"
                id="teamName"
                className={`form-control ${
                  errors.teamName ? "is-invalid" : ""
                }`}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="homeStadium" className="form-label">
                Sân nhà
              </label>
              <input
                type="text"
                id="homeStadium"
                className={`form-control ${
                  errors.homeStadium ? "is-invalid" : ""
                }`}
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
                        className={`form-control ${
                          errors.players?.[index]?.name ? "is-invalid" : ""
                        }`}
                        value={player.name}
                        onChange={(e) => handlePlayerChange(index, e)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="dob"
                        className={`form-control ${
                          errors.players?.[index]?.dob ? "is-invalid" : ""
                        }`}
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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./TeamRegistration.css";
import {
  FaClipboardList,
  FaUsers,
  FaHistory,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const TEAM_CODE_REGEX = /^FC\d{3}$/;

const TeamRegistration = () => {
  const { token, user, fetchCurrentUser } = useAuth();
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Check if user is team_owner with a team assigned
  const isTeamOwner = user?.role === "team_owner";
  const isEditMode = isTeamOwner && user?.team_id;

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // State for the form
  const [teamName, setTeamName] = useState("");
  const [homeStadium, setHomeStadium] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [players, setPlayers] = useState([
    { playerCode: "", name: "", dob: "", type: "Trong nước", notes: "" },
  ]);
  const [settings, setSettings] = useState(null);
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

  // State for the history list
  const [teamHistory, setTeamHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 5;

  // State for edit mode (team_owner case)
  const [isLoadingOwnTeam, setIsLoadingOwnTeam] = useState(false);

  const endOfPlayersRef = useRef(null); // Ref for auto-scrolling

  const fetchTeamHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get("/api/teams");
      setTeamHistory((response.data.data || []).reverse());
      setCurrentPage(1); // Reset to first page when refetching
    } catch (error) {
      console.error("Failed to fetch team history:", error);
      setToast({
        type: "error",
        message: "Không thể tải lịch sử đội bóng.",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load user's own team if in edit mode
  useEffect(() => {
    if (!isEditMode || !user?.team_id) {
      return;
    }

    const fetchOwnTeam = async () => {
      try {
        setIsLoadingOwnTeam(true);
        const response = await axios.get(`/api/teams/${user.team_id}`);
        const team = response.data;

        setTeamCode(team.team_code || "");
        setTeamName(team.name || "");
        setHomeStadium(team.home_stadium || "");
        setPlayers(
          (team.players || []).map((p) => ({
            playerCode: p.player_code || "",
            name: p.name || "",
            dob: p.dob || "",
            type: p.type || "Trong nước",
            notes: p.notes || "",
          }))
        );
      } catch (error) {
        console.error("Failed to load team:", error);
        setToast({
          type: "error",
          message: "Không thể tải thông tin đội của bạn.",
        });
      } finally {
        setIsLoadingOwnTeam(false);
      }
    };

    fetchOwnTeam();
  }, [isEditMode, user?.team_id]);

  useEffect(() => {
    fetchTeamHistory();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
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
  }, [token]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    const minPlayers = Number(settings.team_min_players) || 1;
    setPlayers((prev) => {
      if (prev.length >= minPlayers) {
        return prev;
      }
      const extras = Array.from({ length: minPlayers - prev.length }, () => ({
        playerCode: "",
        name: "",
        dob: "",
        type: "Trong nước",
        notes: "",
      }));
      return [...prev, ...extras];
    });
  }, [settings]);

  const minPlayers = useMemo(
    () => Number(settings?.team_min_players) || 1,
    [settings]
  );
  const maxPlayers = useMemo(
    () => Number(settings?.team_max_players) || 22,
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

  // Effect for auto-scrolling
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
      setToast({
        type: "error",
        message: `Số lượng cầu thủ đã đạt tối đa (${maxPlayers}).`,
      });
      return;
    }
    setPlayers([
      ...players,
      { playerCode: "", name: "", dob: "", type: "Trong nước", notes: "" },
    ]);
  };

  const handleRemovePlayer = (index) => {
    if (players.length > minPlayers) {
      const values = [...players];
      values.splice(index, 1);
      setPlayers(values);
    } else {
      setToast({
        type: "error",
        message: `Đội bóng phải có ít nhất ${minPlayers} cầu thủ.`,
      });
    }
  };

  const [errors, setErrors] = useState({}); // State for validation errors

  const validateForm = () => {
    const newErrors = {};
    const warningMessages = [];

    const normalizedCode = teamCode.trim().toUpperCase();
    const nameEmpty = !teamName.trim();
    const stadiumEmpty = !homeStadium.trim();
    const codeEmpty = !normalizedCode;

    if (codeEmpty || !TEAM_CODE_REGEX.test(normalizedCode)) {
      newErrors.teamCode = true;
      if (!codeEmpty && !TEAM_CODE_REGEX.test(normalizedCode)) {
        warningMessages.push(
          "Mã đội phải theo định dạng FCxxx (ví dụ: FC001)."
        );
      }
    }

    if (codeEmpty || nameEmpty || stadiumEmpty) {
      if (codeEmpty) newErrors.teamCode = true;
      if (nameEmpty) newErrors.teamName = true;
      if (stadiumEmpty) newErrors.homeStadium = true;
      if (
        !warningMessages.includes(
          "Mã đội, tên đội và sân nhà không được để trống."
        )
      ) {
        warningMessages.push("Mã đội, tên đội và sân nhà không được để trống.");
      }
    }

    let foreignPlayers = 0;
    const playerErrors = [];
    let hasAgeError = false;
    let hasDobError = false;
    let hasPlayerCodeError = false;
    const playerCodeSet = new Set();
    let hasDuplicatePlayerCode = false;

    players.forEach((player, index) => {
      const playerError = {};

      // Validate player code
      const code = (player.playerCode || "").trim();
      if (!code) {
        playerError.playerCode = true;
        hasPlayerCodeError = true;
      } else if (playerCodeSet.has(code)) {
        playerError.playerCode = true;
        hasDuplicatePlayerCode = true;
      } else {
        playerCodeSet.add(code);
      }

      if (!player.name.trim()) playerError.name = true;
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
      warningMessages.push(
        "Một hoặc nhiều cầu thủ thiếu hoặc sai định dạng ngày sinh."
      );
    }
    if (hasAgeError) {
      warningMessages.push("Một hoặc nhiều cầu thủ sai độ tuổi (16-40).");
    }
    if (playerErrors.length > 0 && !hasDobError) {
      warningMessages.push("Tên cầu thủ không được để trống.");
    }

    if (hasPlayerCodeError) {
      warningMessages.push("Mã cầu thủ không được để trống.");
    }

    if (hasDuplicatePlayerCode) {
      warningMessages.push("Mã cầu thủ bị trùng lặp.");
    }

    if (playerErrors.length > 0) {
      newErrors.players = playerErrors;
    }

    if (players.length < minPlayers) {
      warningMessages.push(`Đội bóng phải có ít nhất ${minPlayers} cầu thủ.`);
    }

    if (players.length > maxPlayers) {
      warningMessages.push(
        `Đội bóng chỉ được đăng ký tối đa ${maxPlayers} cầu thủ.`
      );
    }

    if (foreignPlayers > foreignLimit) {
      warningMessages.push(
        `Số lượng cầu thủ nước ngoài không được vượt quá ${foreignLimit}.`
      );
    }

    setErrors(newErrors);
    return warningMessages;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessages = validateForm();

    if (validationMessages.length > 0) {
      const combinedMessage = validationMessages.join(" ");
      setToast({
        type: "error",
        message: combinedMessage,
      });
      return;
    }

    setErrors({});
    try {
      let response;

      if (isEditMode) {
        // Update existing team (PUT)
        response = await axios.put(`/api/teams/${user.team_id}`, {
          teamCode,
          teamName,
          homeStadium,
          players,
        });
        setToast({
          type: "success",
          message: response.data.message || "Cập nhật đội bóng thành công!",
        });
      } else {
        // Create new team (POST)
        response = await axios.post("/api/teams", {
          teamCode,
          teamName,
          homeStadium,
          players,
        });
        setToast({
          type: "success",
          message: response.data.message || "Đăng ký đội bóng thành công!",
        });
        // Clear form only on successful new registration
        setTeamCode("");
        setTeamName("");
        setHomeStadium("");
        setPlayers([
          { playerCode: "", name: "", dob: "", type: "Trong nước", notes: "" },
        ]);
        // Refresh user data to get team_id
        await fetchCurrentUser();
      }

      fetchTeamHistory();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Đã có lỗi xảy ra, vui lòng thử lại.";

      setToast({
        type: "error",
        message: errorMessage,
      });
    }
  };

  return (
    <div className="registration-container">
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}
          {toast.message}
        </div>
      )}
      <div className="row">
        <div className="col-lg-8 mb-3 mb-lg-0">
          <div className="registration-form-card">
            <h3 className="mb-3">
              <FaClipboardList />{" "}
              {isEditMode ? "Sửa Đội Bóng" : "Hồ Sơ Đội Bóng"}
            </h3>
            {isLoadingOwnTeam && (
              <div className="alert alert-info">Đang tải thông tin đội...</div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="teamCode" className="form-label">
                    Mã đội (unique)
                  </label>
                  <input
                    type="text"
                    id="teamCode"
                    className={`form-control ${
                      errors.teamCode ? "is-invalid" : ""
                    }`}
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: FC001"
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
              <h3 className="mt-3 mb-3">
                <FaUsers /> Danh sách cầu thủ
              </h3>
              <div className="table-responsive">
                <table className="table player-table">
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "10%" }}>Mã Cầu Thủ</th>
                      <th style={{ width: "27%" }}>Cầu Thủ</th>
                      <th style={{ width: "8%" }}>Ngày Sinh</th>
                      <th style={{ width: "17%" }}>Loại Cầu Thủ</th>
                      <th style={{ width: "23%" }}>Ghi Chú</th>
                      <th style={{ width: "5%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            name="playerCode"
                            className={`form-control ${
                              errors.players?.[index]?.playerCode
                                ? "is-invalid"
                                : ""
                            }`}
                            value={player.playerCode}
                            onChange={(e) => handlePlayerChange(index, e)}
                            placeholder="VD: P001"
                          />
                        </td>
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
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: 0 }} colSpan="7">
                        <div ref={endOfPlayersRef} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddPlayer}
                >
                  <FaPlus /> Thêm cầu thủ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isLoadingOwnTeam}
                >
                  {isEditMode ? "Cập nhật đội" : "Đăng ký đội bóng"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="registration-form-card">
            <h3 className="mb-3">
              <FaHistory /> {isEditMode ? "Đội của tôi" : "Lịch sử đăng ký"}
            </h3>
            {isEditMode ? (
              // For team owners, show only their team
              isLoadingOwnTeam ? (
                <p>Đang tải...</p>
              ) : user?.team_id ? (
                <div className="alert alert-info">
                  <strong>Đội của bạn:</strong>
                  <p className="mb-0 mt-2">{teamName || "Chưa có tên"}</p>
                  <small>Mã: {teamCode}</small>
                </div>
              ) : (
                <p>Bạn chưa có đội. Vui lòng đăng ký đội mới.</p>
              )
            ) : (
              // For other users, show history
              <>
                {historyLoading ? (
                  <p>Loading history...</p>
                ) : teamHistory.length === 0 ? (
                  <p>Chưa có đội nào được đăng ký.</p>
                ) : (
                  <>
                    <div className="list-group list-group-flush">
                      {(() => {
                        const indexOfLastTeam = currentPage * teamsPerPage;
                        const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
                        const currentTeams = teamHistory.slice(
                          indexOfFirstTeam,
                          indexOfLastTeam
                        );

                        return currentTeams.map((team) => (
                          <Link
                            key={team.id}
                            to={`/teams/${team.id}`}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-bold">
                                {team.team_code ? `${team.team_code} · ` : ""}
                                {team.name}
                              </div>
                              <small className="text-muted">
                                {team.home_stadium}
                              </small>
                            </div>
                            <span className="badge bg-primary rounded-pill">
                              {team.player_count}
                            </span>
                          </Link>
                        ));
                      })()}
                    </div>

                    {/* Pagination Controls */}
                    {teamHistory.length > teamsPerPage && (
                      <div className="pagination-container">
                        <button
                          className="pagination-btn"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          ‹
                        </button>

                        {(() => {
                          const totalPages = Math.ceil(
                            teamHistory.length / teamsPerPage
                          );
                          const pages = [];
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <button
                                key={i}
                                className={`pagination-btn ${
                                  currentPage === i ? "active" : ""
                                }`}
                                onClick={() => setCurrentPage(i)}
                              >
                                {i}
                              </button>
                            );
                          }
                          return pages;
                        })()}

                        <button
                          className="pagination-btn"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(
                                prev + 1,
                                Math.ceil(teamHistory.length / teamsPerPage)
                              )
                            )
                          }
                          disabled={
                            currentPage ===
                            Math.ceil(teamHistory.length / teamsPerPage)
                          }
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistration;

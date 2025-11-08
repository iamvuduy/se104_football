const express = require("express");
const db = require("../database");
const { loadSettings } = require("../services/settingsService");

const router = express.Router();

const TEAM_CODE_REGEX = /^FC\d{3}$/;

// GET /api/teams - Fetch all teams
router.get("/", (req, res) => {
  const { unassigned } = req.query;

  let sql = `
        SELECT
            t.id,
            t.team_code,
            t.name,
            t.home_stadium,
            COUNT(p.id) as player_count
        FROM
            teams t
        LEFT JOIN
            players p ON t.id = p.team_id
    `;

  const params = [];

  if (unassigned === "true") {
    sql += " WHERE t.group_id IS NULL";
  }

  sql += `
    GROUP BY
      t.id
    ORDER BY
      t.team_code COLLATE NOCASE
    `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Error fetching teams:", err.message);
      return res.status(500).json({ error: "Failed to fetch teams." });
    }
    console.log("SQL:", sql);
    console.log("Params:", params);
    console.log("Rows:", rows);
    res.json({ message: "success", data: rows });
  });
});

// GET /api/teams/:id - Fetch a single team with its players
router.get("/:id", (req, res) => {
  const teamId = req.params.id;

  // Fetch team details
  db.get(
    "SELECT id, team_code, name, home_stadium FROM teams WHERE id = ?",
    [teamId],
    (err, team) => {
      if (err) {
        console.error("Error fetching team:", err.message);
        return res.status(500).json({ error: "Failed to fetch team." });
      }
      if (!team) {
        return res.status(404).json({ error: "Team not found." });
      }

      // Fetch players for the team
      db.all(
        "SELECT id, name, dob, type, notes FROM players WHERE team_id = ? ORDER BY id",
        [teamId],
        (err, players) => {
          if (err) {
            console.error("Error fetching players:", err.message);
            return res
              .status(500)
              .json({ error: "Failed to fetch players for the team." });
          }
          team.players = players;
          res.json(team);
        }
      );
    }
  );
});

// POST /api/teams - Register a new team
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
    age--;
  }
  return age;
};

const validatePlayersWithSettings = (players, settings) => {
  if (!Array.isArray(players) || players.length === 0) {
    return "Danh sách cầu thủ không hợp lệ.";
  }

  const minPlayers = Number(settings.team_min_players) || 1;
  const maxPlayers = Number(settings.team_max_players) || 99;
  const minAge = Number(settings.player_min_age) || 0;
  const maxAge = Number(settings.player_max_age) || 200;
  const foreignLimit = Number(settings.foreign_player_limit) || players.length;

  if (players.length < minPlayers) {
    return `Mỗi đội phải có ít nhất ${minPlayers} cầu thủ.`;
  }

  if (players.length > maxPlayers) {
    return `Mỗi đội chỉ được đăng ký tối đa ${maxPlayers} cầu thủ.`;
  }

  let foreignCount = 0;

  for (let i = 0; i < players.length; i += 1) {
    const player = players[i];
    if (!player || !player.name || !player.dob || !player.type) {
      return `Thông tin cầu thủ thứ ${i + 1} không đầy đủ.`;
    }

    const age = calculateAge(player.dob);
    if (age === null) {
      return `Ngày sinh của cầu thủ thứ ${i + 1} không hợp lệ.`;
    }
    if (age < minAge || age > maxAge) {
      return `Tuổi của cầu thủ thứ ${
        i + 1
      } phải nằm trong khoảng ${minAge}-${maxAge}.`;
    }

    if (player.type === "Ngoài nước") {
      foreignCount += 1;
    }
  }

  if (foreignCount > foreignLimit) {
    return `Số cầu thủ nước ngoài không được vượt quá ${foreignLimit}.`;
  }

  return null;
};

router.post("/", async (req, res) => {
  const { teamCode, teamName, homeStadium, players } = req.body;

  if (!teamCode || teamName === undefined || homeStadium === undefined) {
    return res.status(400).json({ error: "Invalid data provided." });
  }

  if (!Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ error: "Danh sách cầu thủ không hợp lệ." });
  }

  const normalizedCode = String(teamCode || "")
    .trim()
    .toUpperCase();
  if (!normalizedCode) {
    return res.status(400).json({ error: "Mã đội không được để trống." });
  }

  if (!TEAM_CODE_REGEX.test(normalizedCode)) {
    return res.status(400).json({
      error: "Mã đội phải theo định dạng FCxxx (ví dụ: FC001).",
    });
  }

  const cleanedName = String(teamName || "").trim();
  const cleanedStadium = String(homeStadium || "").trim();
  if (!cleanedName || !cleanedStadium) {
    return res
      .status(400)
      .json({ error: "Tên đội và sân nhà không được để trống." });
  }

  let settings;
  try {
    settings = await loadSettings();
  } catch (err) {
    console.error("Error loading settings:", err.message);
    return res.status(500).json({ error: "Không thể tải quy định giải đấu." });
  }

  const validationError = validatePlayersWithSettings(players, settings);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const insertTeamSql = `INSERT INTO teams (team_code, name, home_stadium) VALUES (?, ?, ?)`;

  db.run(
    insertTeamSql,
    [normalizedCode, cleanedName, cleanedStadium],
    function (err) {
      if (err) {
        console.error("Error inserting team:", err.message);
        return res.status(500).json({
          error: "Could not save team. Mã đội hoặc tên đội có thể đã tồn tại.",
        });
      }

      const teamId = this.lastID;
      const insertPlayerSql = `INSERT INTO players (team_id, name, dob, type, notes) VALUES (?, ?, ?, ?, ?)`;

      (async () => {
        try {
          for (const player of players) {
            await new Promise((resolve, reject) => {
              const { name, dob, type, notes } = player;
              db.run(
                insertPlayerSql,
                [teamId, name, dob, type, notes],
                (err) => {
                  if (err) {
                    console.error("Error inserting player:", err.message);
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });
          }
          res
            .status(201)
            .json({ message: "Team registered successfully!", teamId: teamId });
        } catch (err) {
          // Attempt to clean up the created team if player insertion fails
          db.run(`DELETE FROM teams WHERE id = ?`, [teamId], () => {
            res
              .status(500)
              .json({ error: "An error occurred while saving players." });
          });
        }
      })();
    }
  );
});

// Temporary debug route
router.get("/debug-teams", (req, res) => {
  console.log("--- DEBUG: Fetching all teams from database ---");
  const sql = `SELECT * FROM teams`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("DEBUG ERROR:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("DEBUG DATA:", rows);
    res.json({ message: "success", data: rows });
  });
});

// PUT /api/teams/:id - Update a team's details
router.put("/:id", async (req, res) => {
  const teamId = req.params.id;
  const { teamCode, teamName, homeStadium, players } = req.body;

  if (
    teamCode === undefined ||
    typeof teamName !== "string" ||
    typeof homeStadium !== "string" ||
    !Array.isArray(players) ||
    players.length === 0
  ) {
    return res.status(400).json({ error: "Invalid data provided." });
  }

  const normalizedCode = String(teamCode || "")
    .trim()
    .toUpperCase();
  if (!normalizedCode) {
    return res.status(400).json({ error: "Mã đội không được để trống." });
  }

  if (!TEAM_CODE_REGEX.test(normalizedCode)) {
    return res.status(400).json({
      error: "Mã đội phải theo định dạng FCxxx (ví dụ: FC001).",
    });
  }

  const trimmedName = teamName.trim();
  const trimmedStadium = homeStadium.trim();

  if (!trimmedName || !trimmedStadium) {
    return res
      .status(400)
      .json({ error: "Tên đội và sân nhà không được để trống." });
  }

  let settings;
  try {
    settings = await loadSettings();
  } catch (err) {
    console.error("Error loading settings:", err.message);
    return res.status(500).json({ error: "Không thể tải quy định giải đấu." });
  }

  const validationError = validatePlayersWithSettings(players, settings);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const updateTeamSql = `UPDATE teams SET team_code = ?, name = ?, home_stadium = ? WHERE id = ?`;

  db.run(
    updateTeamSql,
    [normalizedCode, trimmedName, trimmedStadium, teamId],
    function (err) {
      if (err) {
        console.error("Error updating team:", err.message);
        return res.status(500).json({ error: "Could not update team." });
      }

      const deletePlayersSql = `DELETE FROM players WHERE team_id = ?`;
      db.run(deletePlayersSql, [teamId], (err) => {
        if (err) {
          console.error("Error deleting old players:", err.message);
          return res
            .status(500)
            .json({ error: "Could not update team players." });
        }

        const insertPlayerSql = `INSERT INTO players (team_id, name, dob, type, notes) VALUES (?, ?, ?, ?, ?)`;
        (async () => {
          try {
            for (const player of players) {
              await new Promise((resolve, reject) => {
                const { name, dob, type, notes } = player;
                db.run(
                  insertPlayerSql,
                  [teamId, name, dob, type, notes],
                  (err) => {
                    if (err) {
                      console.error("Error inserting player:", err.message);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            }
            res
              .status(200)
              .json({ message: "Team updated successfully!", teamId: teamId });
          } catch (err) {
            res
              .status(500)
              .json({ error: "An error occurred while updating players." });
          }
        })();
      });
    }
  );
});

// DELETE /api/teams/:id - Delete a team
router.delete("/:id", (req, res) => {
  const teamId = req.params.id;

  const deletePlayersSql = `DELETE FROM players WHERE team_id = ?`;
  db.run(deletePlayersSql, [teamId], (err) => {
    if (err) {
      console.error("Error deleting players:", err.message);
      return res.status(500).json({ error: "Could not delete team players." });
    }

    const deleteTeamSql = `DELETE FROM teams WHERE id = ?`;
    db.run(deleteTeamSql, [teamId], function (err) {
      if (err) {
        console.error("Error deleting team:", err.message);
        return res.status(500).json({ error: "Could not delete team." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Team not found." });
      }

      res.status(200).json({ message: "Team deleted successfully!" });
    });
  });
});

module.exports = router;

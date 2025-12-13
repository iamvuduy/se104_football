const express = require("express");
const db = require("../database");
const { loadSettings } = require("../services/settingsService");
const teamOwnerMiddleware = require("../middleware/teamOwner");
const {
  generateTeamCode,
  generatePlayerCode,
} = require("../services/idGeneratorService");

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
        "SELECT id, name, dob, type, notes, player_code FROM players WHERE team_id = ? ORDER BY id",
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
  const { teamName, homeStadium, players } = req.body;
  console.log(
    "DEBUG: POST /api/teams payload:",
    JSON.stringify(req.body, null, 2)
  );

  if (teamName === undefined || homeStadium === undefined) {
    return res.status(400).json({ error: "Invalid data provided." });
  }

  if (!Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ error: "Danh sách cầu thủ không hợp lệ." });
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

  // Auto-generate Team Code
  let autoTeamCode;
  try {
    autoTeamCode = await generateTeamCode();
    console.log("DEBUG: Generated team code:", autoTeamCode);
  } catch (err) {
    console.error("Error generating team code:", err.message);
    return res.status(500).json({ error: "Không thể tạo mã đội." });
  }

  const insertTeamSql = `INSERT INTO teams (team_code, name, home_stadium) VALUES (?, ?, ?)`;
  console.log(
    "DEBUG: Attempting to insert team with code:",
    autoTeamCode,
    "name:",
    cleanedName
  );

  db.run(
    insertTeamSql,
    [autoTeamCode, cleanedName, cleanedStadium],
    function (err) {
      if (err) {
        console.error("Error inserting team - Full error:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        return res.status(500).json({
          error:
            "Could not save team. Tên đội có thể đã tồn tại. Error: " +
            err.message,
        });
      }

      const teamId = this.lastID;
      const insertPlayerSql = `INSERT INTO players (team_id, name, dob, type, notes, player_code) VALUES (?, ?, ?, ?, ?, ?)`;

      (async () => {
        try {
          for (const player of players) {
            // Auto-generate Player Code
            let autoPlayerCode;
            try {
              autoPlayerCode = await generatePlayerCode();
            } catch (err) {
              throw new Error(`Error generating player code: ${err.message}`);
            }

            await new Promise((resolve, reject) => {
              const { name, dob, type, notes } = player;
              console.log("=== DEBUG POST TEAM: Player data ===");
              console.log("player name:", name);
              console.log("auto playerCode generated:", autoPlayerCode);

              db.run(
                insertPlayerSql,
                [teamId, name, dob, type, notes, autoPlayerCode],
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

          // Nếu user là team_owner, cập nhật team_id của user
          if (req.user?.role === "team_owner") {
            db.run(
              `UPDATE users SET team_id = ? WHERE id = ?`,
              [teamId, req.user.id],
              (updateErr) => {
                if (updateErr) {
                  console.error(
                    "Warning: Could not update user team_id:",
                    updateErr.message
                  );
                  // Không fail request, chỉ warn
                }
              }
            );
          }

          res.status(201).json({
            message: "Team registered successfully!",
            teamId: teamId,
            teamCode: autoTeamCode,
          });
        } catch (err) {
          console.error("CRITICAL ERROR in POST /api/teams:", err);
          // Attempt to clean up the created team if player insertion fails
          db.run(`DELETE FROM teams WHERE id = ?`, [teamId], () => {
            res.status(500).json({
              error: err.message || "An error occurred while saving players.",
            });
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
router.put("/:id", teamOwnerMiddleware, async (req, res) => {
  const teamId = req.params.id;
  const { teamName, homeStadium, players } = req.body;

  console.log("=== PUT /api/teams/:id DEBUG ===");
  console.log("Team ID:", teamId);
  console.log("teamName:", teamName, "type:", typeof teamName);
  console.log("homeStadium:", homeStadium, "type:", typeof homeStadium);
  console.log(
    "players:",
    Array.isArray(players) ? `Array(${players.length})` : typeof players
  );
  console.log("Full body:", JSON.stringify(req.body, null, 2));

  if (
    typeof teamName !== "string" ||
    typeof homeStadium !== "string" ||
    !Array.isArray(players) ||
    players.length === 0
  ) {
    console.log("❌ Validation failed:");
    console.log(
      "  typeof teamName !== 'string'?",
      typeof teamName !== "string"
    );
    console.log(
      "  typeof homeStadium !== 'string'?",
      typeof homeStadium !== "string"
    );
    console.log("  !Array.isArray(players)?", !Array.isArray(players));
    console.log(
      "  players.length === 0?",
      Array.isArray(players) && players.length === 0
    );
    return res.status(400).json({ error: "Invalid data provided." });
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

  const updateTeamSql = `UPDATE teams SET name = ?, home_stadium = ? WHERE id = ?`;

  db.run(updateTeamSql, [trimmedName, trimmedStadium, teamId], function (err) {
    if (err) {
      console.error("Error updating team:", err.message);
      return res.status(500).json({ error: "Could not update team." });
    }

    // Delete old players and insert new ones with auto-generated player codes
    (async () => {
      try {
        // Now safe to delete old players and insert new ones
        const deletePlayersSql = `DELETE FROM players WHERE team_id = ?`;
        db.run(deletePlayersSql, [teamId], async (err) => {
          if (err) {
            console.error("Error deleting old players:", err.message);
            return res
              .status(500)
              .json({ error: "Could not update team players." });
          }

          // Insert new players with auto-generated player codes or preserve existing ones
          try {
            for (const player of players) {
              // Use existing player code if available, otherwise generate new one
              let playerCodeToUse = player.playerCode;

              if (!playerCodeToUse) {
                try {
                  playerCodeToUse = await generatePlayerCode();
                } catch (err) {
                  throw new Error(
                    `Error generating player code: ${err.message}`
                  );
                }
              }

              await new Promise((resolve, reject) => {
                const { name, dob, type, notes } = player;

                db.run(
                  `INSERT INTO players (team_id, name, dob, type, notes, player_code) VALUES (?, ?, ?, ?, ?, ?)`,
                  [teamId, name, dob, type, notes, playerCodeToUse],
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
            res.status(200).json({
              message: "Team updated successfully!",
              teamId: teamId,
            });
          } catch (err) {
            res.status(500).json({
              error: err.message || "An error occurred while updating players.",
            });
          }
        });
      } catch (err) {
        res.status(500).json({
          error: err.message || "An error occurred while updating the team.",
        });
      }
    })();
  });
});

// DELETE /api/teams/:id - Delete a team
router.delete("/:id", teamOwnerMiddleware, (req, res) => {
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

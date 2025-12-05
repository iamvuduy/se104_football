const express = require("express");
const router = express.Router();
const db = require("../database");
const admin = require("../middleware/admin");
const { loadSettings } = require("../services/settingsService");

// POST /api/results - Record a new match result
router.post("/", admin, async (req, res) => {
  const { matchInfo, goals } = req.body;

  console.log("=== RECEIVING MATCH RESULT ===");
  console.log("matchInfo:", JSON.stringify(matchInfo, null, 2));
  console.log("goals:", JSON.stringify(goals, null, 2));

  // Basic validation
  if (!matchInfo || !goals || !Array.isArray(goals)) {
    console.log("VALIDATION FAILED: Invalid data structure");
    return res.status(400).json({ error: "Invalid data structure provided." });
  }

  const { matchId, team1, team2, score, stadium, date, time } = matchInfo;

  if (!team1 || !team2 || !score || !date || !time) {
    console.log("VALIDATION FAILED: Missing required fields");
    console.log({ team1, team2, score, stadium, date, time });
    return res
      .status(400)
      .json({
        error: "Invalid match info provided. Please fill all required fields.",
      });
  }

  let settings;
  try {
    settings = await loadSettings();
  } catch (err) {
    return res.status(500).json({ error: "Không thể tải cài đặt giải đấu." });
  }

  const allowedGoalTypes = settings.goal_types || [];
  const goalTimeLimit = Number(settings.goal_time_limit) || 90;

  // Validate score format
  const scoreParts = score.split("-").map((s) => parseInt(s.trim(), 10));
  if (
    scoreParts.length !== 2 ||
    isNaN(scoreParts[0]) ||
    isNaN(scoreParts[1])
  ) {
    return res
      .status(400)
      .json({ error: "Tỷ số không hợp lệ. Vui lòng nhập theo định dạng 'X-Y'." });
  }

  const [team1Goals, team2Goals] = scoreParts;
  const totalGoalsInScore = team1Goals + team2Goals;

  console.log("Score validation:", { team1Goals, team2Goals, totalGoalsInScore, goalsLength: goals.length });

  // Validate total number of goals matches score
  if (totalGoalsInScore !== goals.length) {
    console.log("VALIDATION FAILED: Goal count mismatch");
    return res.status(400).json({
      error: `Tỷ số là ${score} (${totalGoalsInScore} bàn), nhưng bạn đã nhập ${goals.length} bàn thắng. Vui lòng kiểm tra lại.`,
    });
  }

  // Count goals per team - convert all to strings for consistent comparison
  const team1Str = String(team1);
  const team2Str = String(team2);
  
  const team1GoalCount = goals.filter((g) => String(g.team) === team1Str).length;
  const team2GoalCount = goals.filter((g) => String(g.team) === team2Str).length;

  console.log("Goal distribution check:");
  console.log("  team1 ID:", team1, "→", team1Str, "type:", typeof team1);
  console.log("  team2 ID:", team2, "→", team2Str, "type:", typeof team2);
  console.log("  team1GoalCount:", team1GoalCount, "expected:", team1Goals);
  console.log("  team2GoalCount:", team2GoalCount, "expected:", team2Goals);
  console.log("  goals teams:", goals.map(g => ({ team: g.team, teamStr: String(g.team), type: typeof g.team })));

  // Validate goal distribution matches score
  if (team1GoalCount !== team1Goals || team2GoalCount !== team2Goals) {
    console.log("VALIDATION FAILED: Goal distribution mismatch");
    return res.status(400).json({
      error: `Phân bố bàn thắng không khớp với tỷ số. Đội 1 cần ${team1Goals} bàn (hiện có ${team1GoalCount}), Đội 2 cần ${team2Goals} bàn (hiện có ${team2GoalCount}).`,
    });
  }

  for (const goal of goals) {
    console.log("Validating goal:", goal);
    
    // Check each field individually for better error messages
    if (!goal.player || goal.player === "") {
      console.log("VALIDATION FAILED: Missing player");
      return res.status(400).json({ error: `Thiếu thông tin cầu thủ ghi bàn. Vui lòng chọn cầu thủ cho tất cả các bàn thắng.` });
    }
    if (!goal.team || goal.team === "") {
      console.log("VALIDATION FAILED: Missing team");
      return res.status(400).json({ error: `Thiếu thông tin đội ghi bàn. Vui lòng chọn đội cho tất cả các bàn thắng.` });
    }
    if (!goal.type || goal.type === "") {
      console.log("VALIDATION FAILED: Missing goal type");
      return res.status(400).json({ error: `Thiếu loại bàn thắng. Vui lòng chọn loại cho tất cả các bàn thắng.` });
    }
    if (goal.time === undefined || goal.time === null || goal.time === "") {
      console.log("VALIDATION FAILED: Missing time");
      return res.status(400).json({ error: `Thiếu thời điểm ghi bàn. Vui lòng nhập thời điểm cho tất cả các bàn thắng.` });
    }
    
    if (allowedGoalTypes.length > 0 && !allowedGoalTypes.includes(goal.type)) {
      return res
        .status(400)
        .json({ error: `Loại bàn thắng "${goal.type}" không hợp lệ.` });
    }
    const goalMinute = Number(goal.time);
    if (!Number.isFinite(goalMinute) || goalMinute < 0) {
      return res
        .status(400)
        .json({ error: "Thời điểm ghi bàn phải là số không âm." });
    }
    if (goalMinute > goalTimeLimit) {
      return res
        .status(400)
        .json({
          error: `Thời điểm ghi bàn vượt quá giới hạn ${goalTimeLimit} phút.`,
        });
    }
  }

  console.log("All validations passed, proceeding to save...");


  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      return res.status(500).json({ error: "Could not start transaction." });
    }

    // Get match_code from schedules if matchId is provided
    const getMatchCode = (callback) => {
      if (matchId) {
        db.get(
          "SELECT match_code FROM schedules WHERE id = ?",
          [matchId],
          (err, row) => {
            if (err) {
              console.error("Error fetching match_code:", err.message);
              callback(null); // Continue without match_code
            } else {
              callback(row ? row.match_code : null);
            }
          }
        );
      } else {
        callback(null);
      }
    };

    getMatchCode((match_code) => {
      const insertMatchSql = `
            INSERT INTO match_results (team1_id, team2_id, score, stadium, match_date, match_time, match_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      db.run(
        insertMatchSql,
        [team1, team2, score, stadium, date, time, match_code],
        function (err) {
        if (err) {
          db.run("ROLLBACK");
          console.error("Error inserting match result:", err.message);
          return res
            .status(500)
            .json({ error: "Could not save the match result." });
        }

        const matchResultId = this.lastID;
        
        // Get the next goal_code by finding the max existing goal_code
        db.get(
          "SELECT goal_code FROM goals ORDER BY id DESC LIMIT 1",
          [],
          (err, row) => {
            if (err) {
              db.run("ROLLBACK");
              console.error("Error getting last goal code:", err.message);
              return res.status(500).json({ error: "Could not generate goal codes." });
            }

            let nextGoalNumber = 1;
            if (row && row.goal_code) {
              const match = row.goal_code.match(/G(\d+)/);
              if (match) {
                nextGoalNumber = parseInt(match[1], 10) + 1;
              }
            }

            const insertGoalSql = `
                INSERT INTO goals (match_result_id, player_id, team_id, goal_type, goal_time, goal_code)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            // Use Promise-based approach to handle async operations correctly
            const insertGoalPromises = goals.map((goal, index) => {
              return new Promise((resolve, reject) => {
                if (
                  !goal.player ||
                  !goal.team ||
                  !goal.type ||
                  goal.time === undefined
                ) {
                  reject(new Error("Invalid goal data provided."));
                  return;
                }
                
                const goalCode = `G${String(nextGoalNumber + index).padStart(4, "0")}`;
                
                db.run(
                  insertGoalSql,
                  [matchResultId, goal.player, goal.team, goal.type, goal.time, goalCode],
                  function(err) {
                    if (err) {
                      console.error("Error inserting goal:", err.message);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            // Wait for all goals to be inserted
            Promise.all(insertGoalPromises)
              .then(() => {
                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    console.error("Error committing transaction:", err.message);
                    return res.status(500).json({ error: "Could not commit transaction." });
                  }
                  res.status(201).json({
                    message: "Match result recorded successfully!",
                    matchResultId: matchResultId,
                  });
                });
              })
              .catch((error) => {
                db.run("ROLLBACK");
                console.error("Error inserting goals:", error.message);
                return res.status(500).json({
                  error: "An error occurred while saving the goals: " + error.message,
                });
              });
          }
        );
      }
    );
    });
  });
});

// GET /api/results - Get all match results
router.get("/", (req, res) => {
  const sql = `
        SELECT 
            mr.id,
            mr.team1_id,
            mr.team2_id,
            t1.name AS team1_name,
            t2.name AS team2_name,
            mr.score,
            mr.stadium,
            mr.match_date,
            mr.match_time,
            mr.match_code
        FROM match_results mr
        JOIN teams t1 ON mr.team1_id = t1.id
        JOIN teams t2 ON mr.team2_id = t2.id
        ORDER BY mr.match_date DESC, mr.match_time DESC
    `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "success",
      data: rows,
    });
  });
});

// GET /api/results/:id/goals - Get goals for a specific match
router.get("/:id/goals", (req, res) => {
  const matchId = parseInt(req.params.id, 10);
  
  if (!matchId || isNaN(matchId)) {
    return res.status(400).json({ error: "Invalid match ID" });
  }

  const sql = `
    SELECT 
      g.id,
      g.goal_code,
      g.goal_type,
      g.goal_time,
      g.player_id,
      p.name AS player_name,
      p.player_code,
      t.name AS team_name,
      t.id AS team_id
    FROM goals g
    JOIN players p ON g.player_id = p.id
    JOIN teams t ON g.team_id = t.id
    WHERE g.match_result_id = ?
    ORDER BY g.goal_time ASC
  `;

  db.all(sql, [matchId], (err, rows) => {
    if (err) {
      console.error("Error fetching goals:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "success",
      data: rows,
    });
  });
});


// DELETE /api/results/:id - Delete a match result
router.delete("/:id", admin, (req, res) => {
  const matchId = parseInt(req.params.id, 10);
  
  if (!matchId || isNaN(matchId)) {
    return res.status(400).json({ error: "Invalid match ID" });
  }

  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      return res.status(500).json({ error: "Could not start transaction." });
    }

    // First delete all goals associated with this match
    db.run("DELETE FROM goals WHERE match_result_id = ?", [matchId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        console.error("Error deleting goals:", err.message);
        return res.status(500).json({ error: "Could not delete match goals." });
      }

      // Then delete the match result
      db.run("DELETE FROM match_results WHERE id = ?", [matchId], function(err) {
        if (err) {
          db.run("ROLLBACK");
          console.error("Error deleting match result:", err.message);
          return res.status(500).json({ error: "Could not delete match result." });
        }

        if (this.changes === 0) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Match result not found." });
        }

        db.run("COMMIT", (err) => {
          if (err) {
            db.run("ROLLBACK");
            console.error("Error committing transaction:", err.message);
            return res.status(500).json({ error: "Could not commit transaction." });
          }
          res.json({ message: "Match result deleted successfully!" });
        });
      });
    });
  });
});

// PUT /api/results/:id - Update a match result
router.put("/:id", admin, async (req, res) => {
  const matchId = parseInt(req.params.id, 10);
  const { matchInfo, goals } = req.body;

  if (!matchId || isNaN(matchId)) {
    return res.status(400).json({ error: "Invalid match ID" });
  }

  if (!matchInfo || !goals || !Array.isArray(goals)) {
    return res.status(400).json({ error: "Invalid data structure provided." });
  }

  const { team1, team2, score, stadium, date, time } = matchInfo;

  if (!team1 || !team2 || !score || !date || !time) {
    return res.status(400).json({ error: "Invalid match info provided." });
  }

  let settings;
  try {
    settings = await loadSettings();
  } catch (err) {
    return res.status(500).json({ error: "Không thể tải cài đặt giải đấu." });
  }

  const allowedGoalTypes = settings.goal_types || [];
  const goalTimeLimit = Number(settings.goal_time_limit) || 90;

  // Validate score format
  const scoreParts = score.split("-").map((s) => parseInt(s.trim(), 10));
  if (scoreParts.length !== 2 || isNaN(scoreParts[0]) || isNaN(scoreParts[1])) {
    return res.status(400).json({ error: "Tỷ số không hợp lệ." });
  }

  const [team1Goals, team2Goals] = scoreParts;
  const totalGoalsInScore = team1Goals + team2Goals;

  if (totalGoalsInScore !== goals.length) {
    return res.status(400).json({
      error: `Tỷ số là ${score} nhưng bạn đã nhập ${goals.length} bàn thắng.`,
    });
  }

  // Count goals per team
  const team1Str = String(team1);
  const team2Str = String(team2);
  const team1GoalCount = goals.filter((g) => String(g.team) === team1Str).length;
  const team2GoalCount = goals.filter((g) => String(g.team) === team2Str).length;

  if (team1GoalCount !== team1Goals || team2GoalCount !== team2Goals) {
    return res.status(400).json({
      error: `Phân bố bàn thắng không khớp với tỷ số.`,
    });
  }

  // Validate individual goals
  for (const goal of goals) {
    if (!goal.player || !goal.team || !goal.type || goal.time === undefined) {
      return res.status(400).json({ error: "Thiếu thông tin bàn thắng." });
    }
    if (allowedGoalTypes.length > 0 && !allowedGoalTypes.includes(goal.type)) {
      return res.status(400).json({ error: `Loại bàn thắng "${goal.type}" không hợp lệ.` });
    }
    const goalMinute = Number(goal.time);
    if (!Number.isFinite(goalMinute) || goalMinute < 0 || goalMinute > goalTimeLimit) {
      return res.status(400).json({ error: "Thời điểm ghi bàn không hợp lệ." });
    }
  }

  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      return res.status(500).json({ error: "Could not start transaction." });
    }

    // Update match result
    const updateMatchSql = `UPDATE match_results SET team1_id = ?, team2_id = ?, score = ?, stadium = ?, match_date = ?, match_time = ? WHERE id = ?`;

    db.run(updateMatchSql, [team1, team2, score, stadium, date, time, matchId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        console.error("Error updating match result:", err.message);
        return res.status(500).json({ error: "Could not update match result." });
      }

      if (this.changes === 0) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Match result not found." });
      }

      // Delete existing goals
      db.run("DELETE FROM goals WHERE match_result_id = ?", [matchId], function(err) {
        if (err) {
          db.run("ROLLBACK");
          console.error("Error deleting old goals:", err.message);
          return res.status(500).json({ error: "Could not delete old goals." });
        }

        // Get next goal code
        db.get("SELECT goal_code FROM goals ORDER BY id DESC LIMIT 1", [], (err, row) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Could not generate goal codes." });
          }

          let nextGoalNumber = 1;
          if (row && row.goal_code) {
            const match = row.goal_code.match(/G(\d+)/);
            if (match) {
              nextGoalNumber = parseInt(match[1], 10) + 1;
            }
          }

          const insertGoalSql = `INSERT INTO goals (match_result_id, player_id, team_id, goal_type, goal_time, goal_code) VALUES (?, ?, ?, ?, ?, ?)`;

          const insertGoalPromises = goals.map((goal, index) => {
            return new Promise((resolve, reject) => {
              const goalCode = `G${String(nextGoalNumber + index).padStart(4, "0")}`;
              db.run(insertGoalSql, [matchId, goal.player, goal.team, goal.type, goal.time, goalCode], function(err) {
                if (err) {
                  console.error("Error inserting goal:", err.message);
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          });

          Promise.all(insertGoalPromises)
            .then(() => {
              db.run("COMMIT", (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: "Could not commit transaction." });
                }
                res.json({ message: "Match result updated successfully!", matchResultId: matchId });
              });
            })
            .catch((error) => {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "An error occurred while updating goals." });
            });
        });
      });
    });
  });
});

module.exports = router;

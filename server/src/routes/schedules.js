const express = require("express");
const router = express.Router();
const db = require("../database");
const admin = require("../middleware/admin");
const { generateMatchId } = require("../services/idGeneratorService");

// Get all schedules
router.get("/", (req, res) => {
  db.all(
    `
        SELECT 
            s.id, 
            s.match_code,
            s.round, 
            s.matchOrder, 
            s.team1_id,
            t1.team_code AS team1_code,
            t1.name AS team1_name, 
            s.team2_id,
            t2.team_code AS team2_code,
            t2.name AS team2_name, 
            s.date, 
            s.time, 
            s.stadium 
        FROM schedules s
        JOIN teams t1 ON s.team1_id = t1.id
        JOIN teams t2 ON s.team2_id = t2.id
    `,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: rows,
      });
    }
  );
});

// Get schedule by id
router.get("/:id", (req, res) => {
  db.get(
    `
        SELECT 
            s.id, 
            s.match_code,
            s.round, 
            s.matchOrder, 
            s.team1_id,
            t1.team_code AS team1_code,
            t1.name AS team1_name, 
            s.team2_id,
            t2.team_code AS team2_code,
            t2.name AS team2_name, 
            s.date, 
            s.time, 
            s.stadium 
        FROM schedules s
        JOIN teams t1 ON s.team1_id = t1.id
        JOIN teams t2 ON s.team2_id = t2.id
        WHERE s.id = ?
    `,
    [req.params.id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: row,
      });
    }
  );
});

// Create multiple schedules (Batch)
router.post("/batch", admin, async (req, res) => {
  const { matches } = req.body;

  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ error: "Danh sách trận đấu không hợp lệ." });
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  // Helper to promisify db.get
  const dbGet = (sql, params) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  // Helper to promisify db.run
  const dbRun = (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const { round, team1_id, team2_id, date, time, stadium } = match;
    const team1Id = Number(team1_id);
    const team2Id = Number(team2_id);

    try {
      if (!team1Id || !team2Id) {
        throw new Error(`Trận #${i + 1}: Vui lòng chọn đầy đủ hai đội.`);
      }

      if (team1Id === team2Id) {
        throw new Error(`Trận #${i + 1}: Hai đội phải khác nhau.`);
      }

      // Check teams exist
      const t1 = await dbGet(`SELECT id FROM teams WHERE id = ?`, [team1Id]);
      if (!t1) throw new Error(`Trận #${i + 1}: Đội 1 không tồn tại.`);

      const t2 = await dbGet(`SELECT id FROM teams WHERE id = ?`, [team2Id]);
      if (!t2) throw new Error(`Trận #${i + 1}: Đội 2 không tồn tại.`);

      // Check existing match
      const existingMatch = await dbGet(
        `SELECT id FROM schedules WHERE team1_id = ? AND team2_id = ?`,
        [team1Id, team2Id]
      );
      if (existingMatch) {
        throw new Error(
          `Trận #${i + 1}: Cặp đấu này đã tồn tại trong giải đấu.`
        );
      }

      // Check team in round
      const teamInRound = await dbGet(
        `SELECT id FROM schedules WHERE round = ? AND (team1_id = ? OR team2_id = ? OR team1_id = ? OR team2_id = ?)`,
        [round, team1Id, team1Id, team2Id, team2Id]
      );
      if (teamInRound) {
        throw new Error(
          `Trận #${
            i + 1
          }: Một trong hai đội đã có lịch thi đấu trong vòng ${round}.`
        );
      }

      // Generate ID and Insert
      const matchCode = await generateMatchId();
      await dbRun(
        `INSERT INTO schedules (match_code, round, matchOrder, team1_id, team2_id, date, time, stadium) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchCode, round, 1, team1Id, team2Id, date, time, stadium]
      );

      successCount++;
    } catch (err) {
      failCount++;
      errors.push(err.message);
    }
  }

  if (failCount > 0 && successCount === 0) {
    return res.status(400).json({
      error: "Không thể tạo lịch thi đấu.",
      details: errors,
    });
  }

  res.json({
    message: "success",
    data: {
      success: successCount,
      failed: failCount,
      errors: errors,
    },
  });
});

// Create a new schedule
router.post("/", admin, async (req, res) => {
  const { round, matchOrder, team1_id, team2_id, date, time, stadium } =
    req.body;
  const team1Id = Number(team1_id);
  const team2Id = Number(team2_id);

  if (!team1Id || !team2Id) {
    return res
      .status(400)
      .json({ error: "Vui lòng chọn đầy đủ hai đội thi đấu." });
  }

  if (team1Id === team2Id) {
    return res
      .status(400)
      .json({ error: "Hai đội trong một trận phải khác nhau." });
  }

  db.get(
    `SELECT team_code FROM teams WHERE id = ?`,
    [team1Id],
    (err, team1) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!team1) {
        return res.status(400).json({ error: "Đội 1 không tồn tại." });
      }

      db.get(
        `SELECT team_code FROM teams WHERE id = ?`,
        [team2Id],
        (err, team2) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (!team2) {
            return res.status(400).json({ error: "Đội 2 không tồn tại." });
          }

          // Check if match (team1 vs team2) already exists in the tournament
          db.get(
            `SELECT id FROM schedules WHERE team1_id = ? AND team2_id = ?`,
            [team1Id, team2Id],
            (err, existingMatch) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              if (existingMatch) {
                return res.status(400).json({
                  error:
                    "Cặp đấu này (Đội 1 vs Đội 2) đã tồn tại trong giải đấu.",
                });
              }

              // Check if either team already has a match in this round
              db.get(
                `SELECT id FROM schedules WHERE round = ? AND (team1_id = ? OR team2_id = ? OR team1_id = ? OR team2_id = ?)`,
                [round, team1Id, team1Id, team2Id, team2Id],
                (err, teamInRound) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  if (teamInRound) {
                    return res.status(400).json({
                      error:
                        "Một trong hai đội đã có lịch thi đấu trong vòng này.",
                    });
                  }

                  // Auto-generate Match ID
                  (async () => {
                    try {
                      const autoMatchCode = await generateMatchId();

                      // Default matchOrder to 1 if not provided
                      const finalMatchOrder = matchOrder || 1;

                      db.run(
                        `
                INSERT INTO schedules (match_code, round, matchOrder, team1_id, team2_id, date, time, stadium)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
                        [
                          autoMatchCode,
                          round,
                          finalMatchOrder,
                          team1Id,
                          team2Id,
                          date,
                          time,
                          stadium,
                        ],
                        function (err) {
                          if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                          }
                          res.json({
                            message: "success",
                            data: {
                              id: this.lastID,
                              match_code: autoMatchCode,
                            },
                          });
                        }
                      );
                    } catch (err) {
                      return res
                        .status(500)
                        .json({ error: "Không thể tạo mã trận đấu." });
                    }
                  })();
                }
              );
            }
          );
        }
      );
    }
  );
});

// Update a schedule
router.put("/:id", admin, (req, res) => {
  const { round, matchOrder, team1_id, team2_id, date, time, stadium } =
    req.body;
  const team1Id = Number(team1_id);
  const team2Id = Number(team2_id);

  if (!team1Id || !team2Id) {
    return res
      .status(400)
      .json({ error: "Vui lòng chọn đầy đủ hai đội thi đấu." });
  }

  if (team1Id === team2Id) {
    return res
      .status(400)
      .json({ error: "Hai đội trong một trận phải khác nhau." });
  }

  db.get(
    `SELECT team_code FROM teams WHERE id = ?`,
    [team1Id],
    (err, team1) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!team1) {
        return res.status(400).json({ error: "Đội 1 không tồn tại." });
      }

      db.get(
        `SELECT team_code FROM teams WHERE id = ?`,
        [team2Id],
        (err, team2) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (!team2) {
            return res.status(400).json({ error: "Đội 2 không tồn tại." });
          }

          // Check if match (team1 vs team2) already exists in the tournament (excluding current match)
          db.get(
            `SELECT id FROM schedules WHERE team1_id = ? AND team2_id = ? AND id != ?`,
            [team1Id, team2Id, req.params.id],
            (err, existingMatch) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              if (existingMatch) {
                return res.status(400).json({
                  error:
                    "Cặp đấu này (Đội 1 vs Đội 2) đã tồn tại trong giải đấu.",
                });
              }

              // Check if either team already has a match in this round (excluding current match)
              db.get(
                `SELECT id FROM schedules WHERE round = ? AND (team1_id = ? OR team2_id = ? OR team1_id = ? OR team2_id = ?) AND id != ?`,
                [round, team1Id, team1Id, team2Id, team2Id, req.params.id],
                (err, teamInRound) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  if (teamInRound) {
                    return res.status(400).json({
                      error:
                        "Một trong hai đội đã có lịch thi đấu trong vòng này.",
                    });
                  }

                  // Use provided matchId or fallback to auto-generated format
                  const matchCode =
                    req.body.matchId || `${team1.team_code}_${team2.team_code}`;

                  // Check if match_code already exists (excluding current match)
                  db.get(
                    `SELECT id FROM schedules WHERE match_code = ? AND id != ?`,
                    [matchCode, req.params.id],
                    (err, existingCode) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      if (existingCode) {
                        return res.status(400).json({
                          error: `Mã trận đấu '${matchCode}' đã tồn tại.`,
                        });
                      }

                      // Default matchOrder to 1 if not provided
                      const finalMatchOrder = matchOrder || 1;

                      db.run(
                        `
                UPDATE schedules
                SET match_code = ?, round = ?, matchOrder = ?, team1_id = ?, team2_id = ?, date = ?, time = ?, stadium = ?
                WHERE id = ?
              `,
                        [
                          matchCode,
                          round,
                          finalMatchOrder,
                          team1Id,
                          team2Id,
                          date,
                          time,
                          stadium,
                          req.params.id,
                        ],
                        function (err) {
                          if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                          }
                          res.json({
                            message: "success",
                            changes: this.changes,
                            match_code: matchCode,
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Delete a schedule
router.delete("/:id", admin, (req, res) => {
  const scheduleId = req.params.id;

  // First, get the schedule details to find the match_code
  db.get(
    "SELECT match_code, team1_id, team2_id FROM schedules WHERE id = ?",
    [scheduleId],
    (err, schedule) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!schedule) {
        return res.status(404).json({ error: "Lịch thi đấu không tồn tại." });
      }

      // Find related match_results by matching teams and potentially match_code
      // We'll delete match results that have the same team matchup
      db.all(
        `SELECT id FROM match_results 
         WHERE (team1_id = ? AND team2_id = ?) 
            OR (team1_id = ? AND team2_id = ?)`,
        [
          schedule.team1_id,
          schedule.team2_id,
          schedule.team2_id,
          schedule.team1_id,
        ],
        (err, matchResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Delete related goals first (CASCADE)
          const matchResultIds = matchResults.map((mr) => mr.id);

          if (matchResultIds.length > 0) {
            const placeholders = matchResultIds.map(() => "?").join(",");

            // Delete goals related to these match results
            db.run(
              `DELETE FROM goals WHERE match_result_id IN (${placeholders})`,
              matchResultIds,
              (err) => {
                if (err) {
                  return res
                    .status(500)
                    .json({ error: "Lỗi khi xóa bàn thắng: " + err.message });
                }

                // Delete the match results
                db.run(
                  `DELETE FROM match_results WHERE id IN (${placeholders})`,
                  matchResultIds,
                  (err) => {
                    if (err) {
                      return res.status(500).json({
                        error: "Lỗi khi xóa kết quả trận đấu: " + err.message,
                      });
                    }

                    // Finally delete the schedule
                    db.run(
                      "DELETE FROM schedules WHERE id = ?",
                      [scheduleId],
                      function (err) {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }
                        res.json({
                          message: "Đã xóa lịch thi đấu và dữ liệu liên quan",
                          changes: this.changes,
                          deletedMatchResults: matchResults.length,
                        });
                      }
                    );
                  }
                );
              }
            );
          } else {
            // No related match results, just delete the schedule
            db.run(
              "DELETE FROM schedules WHERE id = ?",
              [scheduleId],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({
                  message: "Đã xóa lịch thi đấu",
                  changes: this.changes,
                  deletedMatchResults: 0,
                });
              }
            );
          }
        }
      );
    }
  );
});

module.exports = router;

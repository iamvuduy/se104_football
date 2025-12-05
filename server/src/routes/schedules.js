const express = require("express");
const router = express.Router();
const db = require("../database");

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

// Create a new schedule
router.post("/", (req, res) => {
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
                return res
                  .status(400)
                  .json({ error: "Cặp đấu này (Đội 1 vs Đội 2) đã tồn tại trong giải đấu." });
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
                    return res
                      .status(400)
                      .json({ error: "Một trong hai đội đã có lịch thi đấu trong vòng này." });
                  }

                  // Use provided matchId or fallback to auto-generated format
                  const matchCode =
                    req.body.matchId || `${team1.team_code}_${team2.team_code}`;

                  // Check if match_code already exists
                  db.get(
                    `SELECT id FROM schedules WHERE match_code = ?`,
                    [matchCode],
                    (err, existingCode) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      if (existingCode) {
                        return res
                          .status(400)
                          .json({ error: `Mã trận đấu '${matchCode}' đã tồn tại.` });
                      }

                      // Default matchOrder to 1 if not provided
                      const finalMatchOrder = matchOrder || 1;

                      db.run(
                        `
                INSERT INTO schedules (match_code, round, matchOrder, team1_id, team2_id, date, time, stadium)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                        ],
                        function (err) {
                          if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                          }
                          res.json({
                            message: "success",
                            data: { id: this.lastID, match_code: matchCode },
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

// Update a schedule
router.put("/:id", (req, res) => {
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
                return res
                  .status(400)
                  .json({ error: "Cặp đấu này (Đội 1 vs Đội 2) đã tồn tại trong giải đấu." });
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
                    return res
                      .status(400)
                      .json({ error: "Một trong hai đội đã có lịch thi đấu trong vòng này." });
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
                        return res
                          .status(400)
                          .json({ error: `Mã trận đấu '${matchCode}' đã tồn tại.` });
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
router.delete("/:id", (req, res) => {
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
        [schedule.team1_id, schedule.team2_id, schedule.team2_id, schedule.team1_id],
        (err, matchResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Delete related goals first (CASCADE)
          const matchResultIds = matchResults.map(mr => mr.id);
          
          if (matchResultIds.length > 0) {
            const placeholders = matchResultIds.map(() => '?').join(',');
            
            // Delete goals related to these match results
            db.run(
              `DELETE FROM goals WHERE match_result_id IN (${placeholders})`,
              matchResultIds,
              (err) => {
                if (err) {
                  return res.status(500).json({ error: "Lỗi khi xóa bàn thắng: " + err.message });
                }

                // Delete the match results
                db.run(
                  `DELETE FROM match_results WHERE id IN (${placeholders})`,
                  matchResultIds,
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Lỗi khi xóa kết quả trận đấu: " + err.message });
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
                          deletedMatchResults: matchResults.length
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
                  deletedMatchResults: 0
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

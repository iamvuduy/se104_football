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
            t1.name AS team1, 
            s.team2_id,
            t2.team_code AS team2_code,
            t2.name AS team2, 
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
            t1.name AS team1, 
            s.team2_id,
            t2.team_code AS team2_code,
            t2.name AS team2, 
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

          const matchCode = `${team1.team_code}_${team2.team_code}`;

          db.run(
            `
                INSERT INTO schedules (match_code, round, matchOrder, team1_id, team2_id, date, time, stadium)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              matchCode,
              round,
              matchOrder,
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

          const matchCode = `${team1.team_code}_${team2.team_code}`;

          db.run(
            `
                UPDATE schedules
                SET match_code = ?, round = ?, matchOrder = ?, team1_id = ?, team2_id = ?, date = ?, time = ?, stadium = ?
                WHERE id = ?
              `,
            [
              matchCode,
              round,
              matchOrder,
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
});

// Delete a schedule
router.delete("/:id", (req, res) => {
  db.run("DELETE FROM schedules WHERE id = ?", req.params.id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "deleted", changes: this.changes });
  });
});

module.exports = router;

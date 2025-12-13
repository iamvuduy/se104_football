const express = require("express");
const router = express.Router();
const db = require("../database");
const { loadSettings } = require("../services/settingsService");
const reportService = require("../services/reportService");

// DEBUG ENDPOINT - Cleanup orphaned goals (no auth, for development only)
router.get("/debug/cleanup-now", (req, res) => {
  const isLocalhost =
    req.ip === "127.0.0.1" ||
    req.ip === "::1" ||
    req.ip.includes("localhost") ||
    req.ip === "::ffff:127.0.0.1";

  if (process.env.NODE_ENV === "production" && !isLocalhost) {
    return res.status(403).json({ error: "Not allowed in production" });
  }

  db.run(
    `DELETE FROM goals 
     WHERE match_result_id NOT IN (SELECT id FROM match_results)`,
    [],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const deletedCount = this.changes;

      // Also clear all reports cache
      db.run("DELETE FROM leaderboard_reports", [], (err) => {
        if (err) {
          console.error("Error clearing reports:", err);
        }
        res.json({
          message: `Đã xóa ${deletedCount} goals không hợp lệ. Hãy refresh trình duyệt để thấy kết quả!`,
          deletedCount: deletedCount,
        });
      });
    }
  );
});

// GET /api/leaderboard/teams - Get team leaderboard
router.get("/teams", async (req, res) => {
  try {
    const { asOf, round } = req.query || {};
    let asOfDate = null;

    if (asOf) {
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDatePattern.test(asOf)) {
        return res.status(400).json({
          error:
            "Invalid date format. Please use ISO format YYYY-MM-DD for asOf parameter.",
        });
      }
      asOfDate = asOf;
    }

    // Check if report is published for the requested round
    if (round) {
      const userRole = req.user?.role;
      // Non-tournament-admin users can only see published reports
      if (userRole !== "tournament_admin") {
        const report = await reportService.getReport(
          round,
          "team_leaderboard",
          true // Only published
        );
        if (!report) {
          return res.status(404).json({
            error: "Hiện tại chưa cập nhật bảng xếp hạng vòng này / ngày này",
          });
        }
      }
    }

    const settings = await loadSettings();

    const teams = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM teams", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const matches = await new Promise((resolve, reject) => {
      let sql = `
        SELECT mr.* 
        FROM match_results mr
      `;
      const params = [];
      const conditions = [];

      if (asOfDate) {
        conditions.push("date(mr.match_date) <= date(?)");
        params.push(asOfDate);
      }

      if (round) {
        // Filter by round - match exact team order from schedules
        conditions.push(`
          EXISTS (
            SELECT 1 FROM schedules s
            WHERE mr.team1_id = s.team1_id 
            AND mr.team2_id = s.team2_id
            AND CAST(s.round AS INTEGER) > 0
            AND CAST(s.round AS INTEGER) <= ?
          )
        `);
        params.push(round);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      console.log("=== LEADERBOARD DEBUG ===");
      console.log("Round parameter:", round);
      console.log("SQL Query:", sql);
      console.log("Params:", params);

      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          console.log("Query returned", rows.length, "matches");
          rows.forEach((r) => {
            console.log(
              `  Match ${r.id}: team ${r.team1_id} vs ${r.team2_id} - ${r.score}`
            );
          });
          resolve(rows);
        }
      });
    });

    const teamStats = {};

    teams.forEach((team) => {
      teamStats[team.id] = {
        id: team.id,
        name: team.name,
        mp: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        away_goals: 0,
        headToHead: {},
      };
    });

    const getPoints = (scoreA, scoreB) => {
      if (scoreA > scoreB) return settings.points_win;
      if (scoreA < scoreB) return settings.points_loss;
      return settings.points_draw;
    };

    matches.forEach((match) => {
      const [score1, score2] = match.score.split("-").map(Number);
      const team1Stats = teamStats[match.team1_id];
      const team2Stats = teamStats[match.team2_id];

      if (!team1Stats || !team2Stats) {
        return;
      }

      team1Stats.mp++;
      team2Stats.mp++;

      team1Stats.gf += score1;
      team1Stats.ga += score2;
      team2Stats.gf += score2;
      team2Stats.ga += score1;
      team2Stats.away_goals += score2;

      if (score1 > score2) {
        team1Stats.wins++;
        team2Stats.losses++;
      } else if (score2 > score1) {
        team2Stats.wins++;
        team1Stats.losses++;
      } else {
        team1Stats.draws++;
        team2Stats.draws++;
      }

      const team1Points = getPoints(score1, score2);
      const team2Points = getPoints(score2, score1);
      team1Stats.pts += team1Points;
      team2Stats.pts += team2Points;

      const team1Head = team1Stats.headToHead[match.team2_id] || {
        points: 0,
        goalDiff: 0,
        goalsFor: 0,
        awayGoals: 0,
      };
      team1Head.points += team1Points;
      team1Head.goalDiff += score1 - score2;
      team1Head.goalsFor += score1;
      team1Stats.headToHead[match.team2_id] = team1Head;

      const team2Head = team2Stats.headToHead[match.team1_id] || {
        points: 0,
        goalDiff: 0,
        goalsFor: 0,
        awayGoals: 0,
      };
      team2Head.points += team2Points;
      team2Head.goalDiff += score2 - score1;
      team2Head.goalsFor += score2;
      team2Head.awayGoals += score2;
      team2Stats.headToHead[match.team1_id] = team2Head;
    });

    const leaderboard = Object.values(teamStats).map((stats) => {
      stats.gd = stats.gf - stats.ga;
      return stats;
    });

    const compareDesc = (aVal, bVal) => {
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    };

    const compareAsc = (aVal, bVal) => -compareDesc(aVal, bVal);

    const comparator = (a, b) => {
      for (const key of settings.ranking_priority || []) {
        let diff = 0;
        switch (key) {
          case "points":
            diff = compareDesc(a.pts, b.pts);
            break;
          case "goal_difference":
            diff = compareDesc(a.gd, b.gd);
            break;
          case "goals_for":
            diff = compareDesc(a.gf, b.gf);
            break;
          case "goals_against":
            diff = compareAsc(a.ga, b.ga);
            break;
          case "away_goals":
            diff = compareDesc(a.away_goals || 0, b.away_goals || 0);
            break;
          case "head_to_head": {
            const aRecord = a.headToHead?.[b.id] || {
              points: 0,
              goalDiff: 0,
              goalsFor: 0,
              awayGoals: 0,
            };
            const bRecord = b.headToHead?.[a.id] || {
              points: 0,
              goalDiff: 0,
              goalsFor: 0,
              awayGoals: 0,
            };
            diff = compareDesc(aRecord.points, bRecord.points);
            if (diff === 0) {
              diff = compareDesc(aRecord.goalDiff, bRecord.goalDiff);
            }
            if (diff === 0) {
              diff = compareDesc(aRecord.awayGoals, bRecord.awayGoals);
            }
            if (diff === 0) {
              diff = compareDesc(aRecord.goalsFor, bRecord.goalsFor);
            }
            break;
          }
          default:
            diff = 0;
        }
        if (diff !== 0) {
          return diff;
        }
      }
      if (a.pts !== b.pts) {
        return compareDesc(a.pts, b.pts);
      }
      if (a.gd !== b.gd) {
        return compareDesc(a.gd, b.gd);
      }
      if (a.gf !== b.gf) {
        return compareDesc(a.gf, b.gf);
      }
      return a.name.localeCompare(b.name);
    };

    leaderboard.sort(comparator);

    const latestMatchDate = matches.reduce((latest, match) => {
      if (!match.match_date) {
        return latest;
      }
      if (!latest) {
        return match.match_date;
      }
      return match.match_date > latest ? match.match_date : latest;
    }, null);

    const todayIso = new Date().toISOString().slice(0, 10);
    const generatedAt = asOfDate || latestMatchDate || todayIso;

    res.json({
      leaderboard,
      generatedAt,
      requestedDate: asOfDate,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate leaderboard." });
  }
});

// GET /api/leaderboard/rounds - Get list of rounds that have match results
router.get("/rounds", (req, res) => {
  const sql = `
    SELECT DISTINCT CAST(s.round AS INTEGER) as round
    FROM schedules s
    INNER JOIN match_results mr ON (
      (s.team1_id = mr.team1_id AND s.team2_id = mr.team2_id) OR
      (s.team1_id = mr.team2_id AND s.team2_id = mr.team1_id)
    )
    WHERE CAST(s.round AS INTEGER) > 0
    ORDER BY round ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching rounds with results:", err.message);
      return res.status(500).json({ error: "Failed to fetch rounds." });
    }
    res.json(rows);
  });
});

// GET /api/leaderboard/top-scorers - Get top scorer leaderboard
router.get("/top-scorers", async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Check if report is published for non-tournament-admin users
    if (userRole !== "tournament_admin") {
      const report = await reportService.getReport(
        0,
        "top_scorer_leaderboard",
        true // Only published
      );
      if (!report) {
        return res.status(404).json({
          error: "Hiện tại chưa cập nhật bảng xếp hạng vua phá lưới",
        });
      }
      // Return cached report data if available
      if (report.data && report.data.topScorers) {
        return res.json(report.data.topScorers);
      }
    }

    const sql = `
        SELECT
            p.id,
            p.name as player_name,
            p.player_code,
            t.name as team_name,
            p.type as player_type,
            COUNT(g.id) as goals
        FROM goals g
        JOIN players p ON g.player_id = p.id
        JOIN teams t ON g.team_id = t.id
        JOIN match_results mr ON g.match_result_id = mr.id
        GROUP BY p.id
        ORDER BY goals DESC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    res.status(500).json({ error: "Lỗi khi lấy bảng xếp hạng vua phá lưới" });
  }
});

// ====== REPORT ENDPOINTS ======

// POST /api/leaderboard/reports/team - Create/Update team leaderboard report
// Nếu round được cung cấp, lập báo cáo cho vòng đó
// Nếu không có round, lập báo cáo tổng (tất cả vòng)
// Helper function to create team report
const createTeamReport = async (req, res) => {
  try {
    const { round } = req.body;
    const userRole = req.user?.role;

    // Check if user is tournament admin
    if (userRole !== "tournament_admin") {
      return res.status(403).json({
        error: "Chỉ ban tổ chức mới có thể lập báo cáo",
      });
    }

    // Fetch current leaderboard data
    const settings = await loadSettings();

    const teams = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM teams", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let matches;
    const reportRound = round || 0; // Nếu không có round, lập báo cáo tổng (round = 0)

    if (round) {
      // Lập báo cáo cho vòng cụ thể
      matches = await new Promise((resolve, reject) => {
        const sql = `
          SELECT mr.* 
          FROM match_results mr
          WHERE EXISTS (
            SELECT 1 FROM schedules s
            WHERE mr.team1_id = s.team1_id 
            AND mr.team2_id = s.team2_id
            AND CAST(s.round AS INTEGER) > 0
            AND CAST(s.round AS INTEGER) <= ?
          )
        `;

        db.all(sql, [round], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    } else {
      // Lập báo cáo tổng (tất cả vòng)
      matches = await new Promise((resolve, reject) => {
        const sql = `SELECT mr.* FROM match_results mr`;
        db.all(sql, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    const teamStats = {};

    teams.forEach((team) => {
      teamStats[team.id] = {
        id: team.id,
        name: team.name,
        mp: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        away_goals: 0,
        headToHead: {},
      };
    });

    const getPoints = (scoreA, scoreB) => {
      if (scoreA > scoreB) return settings.points_win;
      if (scoreA < scoreB) return settings.points_loss;
      return settings.points_draw;
    };

    matches.forEach((match) => {
      const [score1, score2] = match.score.split("-").map(Number);
      const team1Stats = teamStats[match.team1_id];
      const team2Stats = teamStats[match.team2_id];

      if (!team1Stats || !team2Stats) {
        return;
      }

      team1Stats.mp++;
      team2Stats.mp++;

      team1Stats.gf += score1;
      team1Stats.ga += score2;
      team2Stats.gf += score2;
      team2Stats.ga += score1;
      team2Stats.away_goals += score2;

      if (score1 > score2) {
        team1Stats.wins++;
        team2Stats.losses++;
      } else if (score2 > score1) {
        team2Stats.wins++;
        team1Stats.losses++;
      } else {
        team1Stats.draws++;
        team2Stats.draws++;
      }

      const team1Points = getPoints(score1, score2);
      const team2Points = getPoints(score2, score1);
      team1Stats.pts += team1Points;
      team2Stats.pts += team2Points;

      const team1Head = team1Stats.headToHead[match.team2_id] || {
        points: 0,
        goalDiff: 0,
        goalsFor: 0,
        awayGoals: 0,
      };
      team1Head.points += team1Points;
      team1Head.goalDiff += score1 - score2;
      team1Head.goalsFor += score1;
      team1Stats.headToHead[match.team2_id] = team1Head;

      const team2Head = team2Stats.headToHead[match.team1_id] || {
        points: 0,
        goalDiff: 0,
        goalsFor: 0,
        awayGoals: 0,
      };
      team2Head.points += team2Points;
      team2Head.goalDiff += score2 - score1;
      team2Head.goalsFor += score2;
      team2Head.awayGoals += score2;
      team2Stats.headToHead[match.team1_id] = team2Head;
    });

    const leaderboard = Object.values(teamStats).map((stats) => {
      stats.gd = stats.gf - stats.ga;
      return stats;
    });

    const compareDesc = (aVal, bVal) => {
      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;
      return 0;
    };

    const compareAsc = (aVal, bVal) => -compareDesc(aVal, bVal);

    const comparator = (a, b) => {
      for (const key of settings.ranking_priority || []) {
        let diff = 0;
        switch (key) {
          case "points":
            diff = compareDesc(a.pts, b.pts);
            break;
          case "goal_difference":
            diff = compareDesc(a.gd, b.gd);
            break;
          case "goals_for":
            diff = compareDesc(a.gf, b.gf);
            break;
          case "goals_against":
            diff = compareAsc(a.ga, b.ga);
            break;
          case "away_goals":
            diff = compareDesc(a.away_goals || 0, b.away_goals || 0);
            break;
          case "head_to_head": {
            const aRecord = a.headToHead?.[b.id] || {
              points: 0,
              goalDiff: 0,
              goalsFor: 0,
              awayGoals: 0,
            };
            const bRecord = b.headToHead?.[a.id] || {
              points: 0,
              goalDiff: 0,
              goalsFor: 0,
              awayGoals: 0,
            };
            diff = compareDesc(aRecord.points, bRecord.points);
            if (diff === 0) {
              diff = compareDesc(aRecord.goalDiff, bRecord.goalDiff);
            }
            if (diff === 0) {
              diff = compareDesc(aRecord.awayGoals, bRecord.awayGoals);
            }
            if (diff === 0) {
              diff = compareDesc(aRecord.goalsFor, bRecord.goalsFor);
            }
            break;
          }
          default:
            diff = 0;
        }
        if (diff !== 0) {
          return diff;
        }
      }
      if (a.pts !== b.pts) {
        return compareDesc(a.pts, b.pts);
      }
      if (a.gd !== b.gd) {
        return compareDesc(a.gd, b.gd);
      }
      if (a.gf !== b.gf) {
        return compareDesc(a.gf, b.gf);
      }
      return a.name.localeCompare(b.name);
    };

    leaderboard.sort(comparator);

    // Save report
    await reportService.createOrUpdateReport(reportRound, "team_leaderboard", {
      leaderboard,
      round: reportRound,
      createdAt: new Date().toISOString(),
    });

    const reportType = round ? `vòng ${round}` : "tổng";
    res.json({
      success: true,
      message: `✓ Báo cáo ${reportType} đã được lập thành công. Báo cáo hiện ở trạng thái draft. Hãy ấn 'Chia Sẻ Báo Cáo' để công khai cho người dùng khác.`,
    });
  } catch (error) {
    console.error("Error creating team report:", error);
    res.status(500).json({ error: "Lỗi khi lập báo cáo" });
  }
};

// POST /api/leaderboard/reports/team - Create team report for specific round
router.post("/reports/team", createTeamReport);

// POST /api/leaderboard/reports/team/all - Create total team report
router.post("/reports/team/all", createTeamReport);

// POST /api/leaderboard/reports/top-scorer - Create top scorer report
router.post("/reports/top-scorer", async (req, res) => {
  try {
    const { round } = req.body;
    const userRole = req.user?.role;

    // Check if user is tournament admin
    if (userRole !== "tournament_admin") {
      return res.status(403).json({
        error: "Chỉ ban tổ chức mới có thể lập báo cáo",
      });
    }

    const sql = `
      SELECT
          p.id,
          p.name as player_name,
          p.player_code,
          t.name as team_name,
          p.type as player_type,
          COUNT(g.id) as goals
      FROM goals g
      JOIN players p ON g.player_id = p.id
      JOIN teams t ON g.team_id = t.id
      GROUP BY p.id
      ORDER BY goals DESC
    `;

    const topScorers = await new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    await reportService.createOrUpdateReport(
      round || 0,
      "top_scorer_leaderboard",
      {
        topScorers,
        round: round || 0,
        createdAt: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      message: "Báo cáo vua phá lưới đã được lập thành công",
    });
  } catch (error) {
    console.error("Error creating top scorer report:", error);
    res.status(500).json({ error: "Lỗi khi lập báo cáo" });
  }
});

// PUT /api/leaderboard/reports/:type/:round/publish - Publish a report
router.put("/reports/:type/:round/publish", async (req, res) => {
  try {
    const { type, round } = req.params;
    const userRole = req.user?.role;

    // Check if user is tournament admin
    if (userRole !== "tournament_admin") {
      return res.status(403).json({
        error: "Chỉ ban tổ chức mới có thể công khai báo cáo",
      });
    }

    const typeMap = {
      team: "team_leaderboard",
      "top-scorer": "top_scorer_leaderboard",
    };

    const reportType = typeMap[type];
    if (!reportType) {
      return res.status(400).json({ error: "Loại báo cáo không hợp lệ" });
    }

    const success = await reportService.publishReport(round, reportType);

    if (!success) {
      return res.status(404).json({ error: "Không tìm thấy báo cáo" });
    }

    res.json({
      success: true,
      message:
        "✓ Báo cáo đã được công khai. Người dùng khác hiện có thể xem bảng xếp hạng vòng " +
        round +
        ".",
    });
  } catch (error) {
    console.error("Error publishing report:", error);
    res.status(500).json({ error: "Lỗi khi công khai báo cáo" });
  }
});

// PUT /api/leaderboard/reports/:type/:round/unpublish - Unpublish a report
router.put("/reports/:type/:round/unpublish", async (req, res) => {
  try {
    const { type, round } = req.params;
    const userRole = req.user?.role;

    // Check if user is tournament admin
    if (userRole !== "tournament_admin") {
      return res.status(403).json({
        error: "Chỉ ban tổ chức mới có thể ẩn báo cáo",
      });
    }

    const typeMap = {
      team: "team_leaderboard",
      "top-scorer": "top_scorer_leaderboard",
    };

    const reportType = typeMap[type];
    if (!reportType) {
      return res.status(400).json({ error: "Loại báo cáo không hợp lệ" });
    }

    const success = await reportService.unpublishReport(round, reportType);

    if (!success) {
      return res.status(404).json({ error: "Không tìm thấy báo cáo" });
    }

    res.json({
      success: true,
      message:
        "✓ Báo cáo đã được ẩn khỏi người dùng khác. Bạn có thể chỉnh sửa và công khai lại sau khi cập nhật.",
    });
  } catch (error) {
    console.error("Error unpublishing report:", error);
    res.status(500).json({ error: "Lỗi khi ẩn báo cáo" });
  }
});

// GET /api/leaderboard/reports/:type/:round - Get a specific report (respects publish status)
router.get("/reports/:type/:round", async (req, res) => {
  try {
    const { type, round } = req.params;
    const userRole = req.user?.role;

    const typeMap = {
      team: "team_leaderboard",
      "top-scorer": "top_scorer_leaderboard",
    };

    const reportType = typeMap[type];
    if (!reportType) {
      return res.status(400).json({ error: "Loại báo cáo không hợp lệ" });
    }

    // Tournament admin can see unpublished reports
    const onlyPublished = userRole !== "tournament_admin";

    const report = await reportService.getReport(
      round,
      reportType,
      onlyPublished
    );

    if (!report) {
      return res.status(404).json({
        error: "Hiện tại chưa cập nhật bảng xếp hạng vòng này / ngày này",
      });
    }

    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Lỗi khi lấy báo cáo" });
  }
});

// GET /api/leaderboard/reports/:type/:round/needs-update - Check if report needs update
router.get("/reports/:type/:round/needs-update", async (req, res) => {
  try {
    const { type, round } = req.params;
    const userRole = req.user?.role;

    // Only tournament admin can check this
    if (userRole !== "tournament_admin") {
      return res.status(403).json({
        error: "Chỉ ban tổ chức mới có thể kiểm tra trạng thái báo cáo",
      });
    }

    const typeMap = {
      team: "team_leaderboard",
      "top-scorer": "top_scorer_leaderboard",
    };

    const reportType = typeMap[type];
    if (!reportType) {
      return res.status(400).json({ error: "Loại báo cáo không hợp lệ" });
    }

    // Get the report
    const report = await new Promise((resolve, reject) => {
      db.get(
        `SELECT created_at FROM leaderboard_reports 
         WHERE round = ? AND type = ? AND is_published = 1`,
        [round, reportType],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!report) {
      return res.json({ needsUpdate: false, reason: "no_report" });
    }

    // Check if there are newer match results for this round
    const newerMatches = await new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM match_results mr
        WHERE EXISTS (
          SELECT 1 FROM schedules s
          WHERE mr.team1_id = s.team1_id 
          AND mr.team2_id = s.team2_id
          AND CAST(s.round AS INTEGER) = ?
        )
        AND datetime(mr.match_date) > datetime(?)
      `;

      db.get(sql, [round, report.created_at], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const needsUpdate = newerMatches.count > 0;

    res.json({
      needsUpdate,
      reason: needsUpdate ? "newer_matches" : "up_to_date",
      reportCreatedAt: report.created_at,
      newerMatchesCount: newerMatches.count,
    });
  } catch (error) {
    console.error("Error checking report update status:", error);
    res.status(500).json({ error: "Lỗi khi kiểm tra trạng thái báo cáo" });
  }
});

// GET /api/leaderboard/reports/status/all - Get publication status of all reports
router.get("/reports/status/all", async (req, res) => {
  try {
    const userRole = req.user?.role;

    // All authenticated users can view published report status
    // Only tournament admin can see unpublished reports
    const onlyPublished = userRole !== "tournament_admin";

    const sql = onlyPublished
      ? `SELECT id, round, type, is_published, created_at, published_at 
         FROM leaderboard_reports 
         WHERE is_published = 1
         ORDER BY type, round DESC`
      : `SELECT id, round, type, is_published, created_at, published_at 
         FROM leaderboard_reports 
         ORDER BY type, round DESC`;

    const reports = await new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching report status:", error);
    res.status(500).json({ error: "Lỗi khi lấy trạng thái báo cáo" });
  }
});

// DELETE /api/leaderboard/cleanup-orphaned-goals - Remove goals without corresponding match results
// Only for tournament admin
router.delete(
  "/cleanup-orphaned-goals",
  require("../middleware/admin"),
  async (req, res) => {
    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `DELETE FROM goals 
         WHERE match_result_id NOT IN (SELECT id FROM match_results)`,
          [],
          function (err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });

      // Also clear all reports cache
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM leaderboard_reports", [], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        message: `Đã xóa ${result} goals không hợp lệ`,
        deletedCount: result,
      });
    } catch (error) {
      console.error("Error cleaning up orphaned goals:", error);
      res.status(500).json({ error: "Lỗi khi dọn dẹp goals" });
    }
  }
);

// GET /api/leaderboard/debug/cleanup-now - Emergency cleanup without auth (for development)
router.get("/debug/cleanup-now", async (req, res) => {
  try {
    // Check if running in development mode or from localhost
    const isLocalhost =
      req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip.includes("localhost");

    if (process.env.NODE_ENV === "production" && !isLocalhost) {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM goals 
         WHERE match_result_id NOT IN (SELECT id FROM match_results)`,
        [],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    // Also clear all reports cache
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM leaderboard_reports", [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      message: `Đã xóa ${result} goals không hợp lệ. Hãy refresh trình duyệt để thấy kết quả!`,
      deletedCount: result,
    });
  } catch (error) {
    console.error("Error cleaning up orphaned goals:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

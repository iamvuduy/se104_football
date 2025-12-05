const express = require("express");
const router = express.Router();
const db = require("../database");
const { loadSettings } = require("../services/settingsService");

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
        // Filter by round using EXISTS to avoid duplicates
        conditions.push(`
          EXISTS (
            SELECT 1 FROM schedules s
            WHERE (
              (mr.team1_id = s.team1_id AND mr.team2_id = s.team2_id) OR
              (mr.team1_id = s.team2_id AND mr.team2_id = s.team1_id)
            )
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
          rows.forEach(r => {
            console.log(`  Match ${r.id}: team ${r.team1_id} vs ${r.team2_id} - ${r.score}`);
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
router.get("/top-scorers", (req, res) => {
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

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;

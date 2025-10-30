const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/leaderboard/teams - Get team leaderboard
router.get('/teams', async (req, res) => {
    try {
        const teams = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM teams", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const matches = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM match_results", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const teamStats = {};

        teams.forEach(team => {
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
                pts: 0
            };
        });

        matches.forEach(match => {
            const [score1, score2] = match.score.split('-').map(Number);
            const team1Stats = teamStats[match.team1_id];
            const team2Stats = teamStats[match.team2_id];

            if (team1Stats) {
                team1Stats.mp++;
                team1Stats.gf += score1;
                team1Stats.ga += score2;
            }
            if (team2Stats) {
                team2Stats.mp++;
                team2Stats.gf += score2;
                team2Stats.ga += score1;
            }

            if (score1 > score2) {
                if (team1Stats) team1Stats.wins++;
                if (team2Stats) team2Stats.losses++;
            } else if (score2 > score1) {
                if (team2Stats) team2Stats.wins++;
                if (team1Stats) team1Stats.losses++;
            } else {
                if (team1Stats) team1Stats.draws++;
                if (team2Stats) team2Stats.draws++;
            }
        });

        const leaderboard = Object.values(teamStats).map(stats => {
            stats.gd = stats.gf - stats.ga;
            stats.pts = (stats.wins * 3) + (stats.draws * 1);
            return stats;
        });

        leaderboard.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.name.localeCompare(b.name);
        });

        res.json(leaderboard);

    } catch (error) {
        res.status(500).json({ error: 'Failed to generate leaderboard.' });
    }
});

// GET /api/leaderboard/top-scorers - Get top scorer leaderboard
router.get('/top-scorers', (req, res) => {
    const sql = `
        SELECT
            p.id,
            p.name as player_name,
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
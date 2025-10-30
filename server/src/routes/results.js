const express = require('express');
const router = express.Router();
const db = require('../database');
const admin = require('../middleware/admin');

// POST /api/results - Record a new match result
router.post('/', admin, (req, res) => {
    const { matchInfo, goals } = req.body;

    // Basic validation
    if (!matchInfo || !goals || !Array.isArray(goals)) {
        return res.status(400).json({ error: 'Invalid data structure provided.' });
    }

    const { team1, team2, score, stadium, date, time } = matchInfo;

    if (!team1 || !team2 || !score || !date || !time) {
        return res.status(400).json({ error: 'Invalid match info provided. Please fill all required fields.' });
    }

    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not start transaction.' });
        }

        const insertMatchSql = `
            INSERT INTO match_results (team1_id, team2_id, score, stadium, match_date, match_time)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertMatchSql, [team1, team2, score, stadium, date, time], function(err) {
            if (err) {
                db.run('ROLLBACK');
                console.error('Error inserting match result:', err.message);
                return res.status(500).json({ error: 'Could not save the match result.' });
            }

            const matchResultId = this.lastID;
            const insertGoalSql = `
                INSERT INTO goals (match_result_id, player_id, team_id, goal_type, goal_time)
                VALUES (?, ?, ?, ?, ?)
            `;

            const stmt = db.prepare(insertGoalSql);
            let goalError = null;

            for (const goal of goals) {
                if (!goal.player || !goal.team || !goal.type || goal.time === undefined) {
                    goalError = 'Invalid goal data provided.';
                    break;
                }
                stmt.run(matchResultId, goal.player, goal.team, goal.type, goal.time, (err) => {
                    if (err) {
                        goalError = 'An error occurred while saving the goals.';
                    }
                });
            }

            stmt.finalize((err) => {
                if (err || goalError) {
                    db.run('ROLLBACK');
                    console.error('Error inserting goals:', err ? err.message : goalError);
                    return res.status(500).json({ error: err ? 'An error occurred while saving the goals.' : goalError });
                } else {
                    db.run('COMMIT', (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Could not commit transaction.' });
                        }
                        res.status(201).json({ message: 'Match result recorded successfully!', matchResultId: matchResultId });
                    });
                }
            });
        });
    });
});

// GET /api/results - Get all match results
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            mr.id,
            t1.name AS team1_name,
            t2.name AS team2_name,
            mr.score,
            mr.stadium,
            mr.match_date,
            mr.match_time
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
            message: 'success',
            data: rows
        });
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/results - Record a new match result
router.post('/', (req, res) => {
    const { team1Name, team2Name, score, stadium, matchDate, matchTime, goals } = req.body;

    // Basic validation
    if (!team1Name || !team2Name || !score || !matchDate || !matchTime || !Array.isArray(goals)) {
        return res.status(400).json({ error: 'Invalid data provided. Please fill all required fields.' });
    }

    db.serialize(() => {
        // Use a transaction to ensure all or nothing is saved
        db.run('BEGIN TRANSACTION');

        const insertMatchSql = `
            INSERT INTO match_results (team1_name, team2_name, score, stadium, match_date, match_time)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertMatchSql, [team1Name, team2Name, score, stadium, matchDate, matchTime], function(err) {
            if (err) {
                db.run('ROLLBACK');
                console.error('Error inserting match result:', err.message);
                return res.status(500).json({ error: 'Could not save the match result.' });
            }

            const matchResultId = this.lastID;
            const insertGoalSql = `
                INSERT INTO goals (match_result_id, player_name, team_name, goal_type, goal_time)
                VALUES (?, ?, ?, ?, ?)
            `;

            // Prepare statement for inserting goals
            const stmt = db.prepare(insertGoalSql);

            for (const goal of goals) {
                // Validate goal object
                if (!goal.playerName || !goal.teamName || !goal.goalType || goal.goalTime === undefined) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: `Invalid goal data provided for player ${goal.playerName}.` });
                }
                stmt.run(matchResultId, goal.playerName, goal.teamName, goal.goalType, goal.goalTime, (err) => {
                    if (err) {
                        // Error will be caught by the finalizer's error handler
                        // No need to rollback here as the loop will be broken by the error in finalize
                    }
                });
            }

            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK');
                    console.error('Error inserting goals:', err.message);
                    // The CHECK constraint failure gives a generic SQLITE_CONSTRAINT error, so a custom message is better.
                    return res.status(400).json({ error: 'An error occurred while saving the goals. Please check that goal types are A, B, or C, and times are between 0-90.' });
                } else {
                    db.run('COMMIT');
                    res.status(201).json({ message: 'Match result recorded successfully!', matchResultId: matchResultId });
                }
            });
        });
    });
});

module.exports = router;

const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/teams - Fetch all teams
router.get('/', (req, res) => {
    const sql = `
        SELECT
            t.id,
            t.name,
            t.home_stadium,
            COUNT(p.id) as player_count
        FROM
            teams t
        LEFT JOIN
            players p ON t.id = p.team_id
        GROUP BY
            t.id
        ORDER BY
            t.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching teams:', err.message);
            return res.status(500).json({ error: 'Failed to fetch teams.' });
        }
        res.json({ teams: rows });
    });
});

// GET /api/teams/:id - Fetch a single team with its players
router.get('/:id', (req, res) => {
    const teamId = req.params.id;

    // Fetch team details
    db.get('SELECT id, name, home_stadium FROM teams WHERE id = ?', [teamId], (err, team) => {
        if (err) {
            console.error('Error fetching team:', err.message);
            return res.status(500).json({ error: 'Failed to fetch team.' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        // Fetch players for the team
        db.all('SELECT id, name, dob, type, notes FROM players WHERE team_id = ? ORDER BY id', [teamId], (err, players) => {
            if (err) {
                console.error('Error fetching players:', err.message);
                return res.status(500).json({ error: 'Failed to fetch players for the team.' });
            }
            team.players = players;
            res.json(team);
        });
    });
});

// POST /api/teams - Register a new team
router.post('/', (req, res) => {
    const { teamName, homeStadium, players } = req.body;

    if (!teamName || !homeStadium || !players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ error: 'Invalid data provided.' });
    }

    const insertTeamSql = `INSERT INTO teams (name, home_stadium) VALUES (?, ?)`;

    db.run(insertTeamSql, [teamName, homeStadium], function(err) {
        if (err) {
            console.error('Error inserting team:', err.message);
            return res.status(500).json({ error: 'Could not save team. It might already exist.' });
        }

        const teamId = this.lastID;
        const insertPlayerSql = `INSERT INTO players (team_id, name, dob, type, notes) VALUES (?, ?, ?, ?, ?)`;
        
        (async () => {
            try {
                for (const player of players) {
                    await new Promise((resolve, reject) => {
                        const { name, dob, type, notes } = player;
                        db.run(insertPlayerSql, [teamId, name, dob, type, notes], (err) => {
                            if (err) {
                                console.error('Error inserting player:', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
                res.status(201).json({ message: 'Team registered successfully!', teamId: teamId });
            } catch (err) {
                // Attempt to clean up the created team if player insertion fails
                db.run(`DELETE FROM teams WHERE id = ?`, [teamId], () => {
                    res.status(500).json({ error: 'An error occurred while saving players.' });
                });
            }
        })();
    });
});

// Temporary debug route
router.get('/debug-teams', (req, res) => {
    console.log('--- DEBUG: Fetching all teams from database ---');
    const sql = `SELECT * FROM teams`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('DEBUG ERROR:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('DEBUG DATA:', rows);
        res.json({ teams: rows });
    });
});


// PUT /api/teams/:id - Update a team's details
router.put('/:id', (req, res) => {
    const teamId = req.params.id;
    const { teamName, homeStadium, players } = req.body;

    if (!teamName || !homeStadium || !players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ error: 'Invalid data provided.' });
    }

    const updateTeamSql = `UPDATE teams SET name = ?, home_stadium = ? WHERE id = ?`;

    db.run(updateTeamSql, [teamName, homeStadium, teamId], function(err) {
        if (err) {
            console.error('Error updating team:', err.message);
            return res.status(500).json({ error: 'Could not update team.' });
        }

        const deletePlayersSql = `DELETE FROM players WHERE team_id = ?`;
        db.run(deletePlayersSql, [teamId], (err) => {
            if (err) {
                console.error('Error deleting old players:', err.message);
                return res.status(500).json({ error: 'Could not update team players.' });
            }

            const insertPlayerSql = `INSERT INTO players (team_id, name, dob, type, notes) VALUES (?, ?, ?, ?, ?)`;
            (async () => {
                try {
                    for (const player of players) {
                        await new Promise((resolve, reject) => {
                            const { name, dob, type, notes } = player;
                            db.run(insertPlayerSql, [teamId, name, dob, type, notes], (err) => {
                                if (err) {
                                    console.error('Error inserting player:', err.message);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                    res.status(200).json({ message: 'Team updated successfully!', teamId: teamId });
                } catch (err) {
                    res.status(500).json({ error: 'An error occurred while updating players.' });
                }
            })();
        });
    });
});

// DELETE /api/teams/:id - Delete a team
router.delete('/:id', (req, res) => {
    const teamId = req.params.id;

    const deletePlayersSql = `DELETE FROM players WHERE team_id = ?`;
    db.run(deletePlayersSql, [teamId], (err) => {
        if (err) {
            console.error('Error deleting players:', err.message);
            return res.status(500).json({ error: 'Could not delete team players.' });
        }

        const deleteTeamSql = `DELETE FROM teams WHERE id = ?`;
        db.run(deleteTeamSql, [teamId], function(err) {
            if (err) {
                console.error('Error deleting team:', err.message);
                return res.status(500).json({ error: 'Could not delete team.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Team not found.' });
            }

            res.status(200).json({ message: 'Team deleted successfully!' });
        });
    });
});

module.exports = router;

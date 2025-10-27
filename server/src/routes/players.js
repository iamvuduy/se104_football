const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/players - Fetch all players with aggregated goal data
router.get('/', (req, res) => {
    // Step 1: Create a map of goal counts for each player.
    const goalCounts = {};
    db.all('SELECT player_name FROM goals', [], (err, goals) => {
        if (err) {
            console.error('Error fetching goals for aggregation:', err.message);
            return res.status(500).json({ error: 'Failed to aggregate goal data.' });
        }

        for (const goal of goals) {
            goalCounts[goal.player_name] = (goalCounts[goal.player_name] || 0) + 1;
        }

        // Step 2: Fetch all players and join with their teams.
        const sql = `
            SELECT 
                p.id, 
                p.name AS playerName, 
                p.type AS playerType, 
                t.name AS teamName
            FROM 
                players p
            JOIN 
                teams t ON p.team_id = t.id
        `;

        db.all(sql, [], (err, players) => {
            if (err) {
                console.error('Error fetching players:', err.message);
                return res.status(500).json({ error: 'Failed to fetch players.' });
            }

            // Step 3: Combine player data with goal counts.
            let combinedData = players.map(player => ({
                ...player,
                totalGoals: goalCounts[player.playerName] || 0
            }));

            // Step 4: Server-side filtering
            const { team, type, search } = req.query;
            if (team) {
                combinedData = combinedData.filter(p => p.teamName === team);
            }
            if (type) {
                combinedData = combinedData.filter(p => p.playerType === type);
            }
            if (search) {
                combinedData = combinedData.filter(p => p.playerName.toLowerCase().includes(search.toLowerCase()));
            }

            // Step 5: Server-side sorting
            const { sort } = req.query;
            if (sort) {
                const [key, direction] = sort.split('_');
                combinedData.sort((a, b) => {
                    let valA = a[key];
                    let valB = b[key];

                    if (typeof valA === 'string') {
                        valA = valA.toLowerCase();
                        valB = valB.toLowerCase();
                    }

                    if (valA < valB) return direction === 'asc' ? -1 : 1;
                    if (valA > valB) return direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            res.json({ message: 'success', data: combinedData });
        });
    });
});

module.exports = router;

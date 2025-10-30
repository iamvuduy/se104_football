const express = require('express');
const router = express.Router();
const db = require('../database');
const admin = require('../middleware/admin');

// GET all groups and their teams
router.get('/', (req, res) => {
    const sql = `
        SELECT g.id as group_id, g.name as group_name, t.id as team_id, t.name as team_name
        FROM groups g
        LEFT JOIN teams t ON g.id = t.group_id
        ORDER BY g.name, t.name
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log('SQL:', sql);
        console.log('Rows:', rows);
        const groups = {};
        rows.forEach(row => {
            if (!groups[row.group_id]) {
                groups[row.group_id] = {
                    id: row.group_id,
                    name: row.group_name,
                    teams: []
                };
            }
            if (row.team_id) {
                groups[row.group_id].teams.push({
                    id: row.team_id,
                    name: row.team_name
                });
            }
        });
        res.json({ groups: Object.values(groups) });
    });
});

// POST create a new group
router.post('/', admin, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }
    const sql = `INSERT INTO groups (name) VALUES (?)`;
    db.run(sql, [name], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

// DELETE a group and unassign its teams (UPDATED LOGIC)
router.delete('/:id', admin, (req, res) => {
    console.log("--- EXECUTING NEW DELETE LOGIC V3 ---");
    const { id } = req.params;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Step 1: Unassign all teams from the group
        const unassignSql = `UPDATE teams SET group_id = NULL WHERE group_id = ?`;
        db.run(unassignSql, [id], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: `Failed to unassign teams: ${err.message}` });
            }
        });

        // Step 2: Delete the group itself
        const deleteSql = `DELETE FROM groups WHERE id = ?`;
        db.run(deleteSql, [id], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: `Failed to delete group: ${err.message}` });
            }
            // It's okay if the group was already gone, but we check for completeness
            if (this.changes === 0) {
                 db.run("ROLLBACK");
                return res.status(404).json({ error: 'Group not found' });
            }
        });

        db.run("COMMIT", (err) => {
             if (err) {
                return res.status(500).json({ error: `Failed to commit transaction: ${err.message}` });
            }
            res.json({ message: 'Group deleted and teams unassigned successfully' });
        });
    });
});


// POST assign teams to groups
router.post('/assign', admin, (req, res) => {
    const assignments = req.body.assignments; // expected format: [{ team_id: 1, group_id: 1 }, ...]

    if (!Array.isArray(assignments)) {
        return res.status(400).json({ error: 'Invalid assignments format. Expected an array.' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const resetSql = `UPDATE teams SET group_id = NULL`;
        db.run(resetSql, (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
        });

        const stmt = db.prepare("UPDATE teams SET group_id = ? WHERE id = ?");
        assignments.forEach(assignment => {
            stmt.run(assignment.group_id, assignment.team_id);
        });

        stmt.finalize((err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            db.run("COMMIT");
            res.json({ message: 'Team assignments updated successfully' });
        });
    });
});



// PUT update a group's name
router.put('/:id', admin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    const sql = `UPDATE groups SET name = ? WHERE id = ?`;
    db.run(sql, [name, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json({ message: 'Group updated successfully', id, name });
    });
});

// POST assign a single team to a group (for autosave drag-and-drop)
router.post('/assign-team', admin, (req, res) => {
    const { teamId, groupId } = req.body;

    if (teamId === undefined) {
        return res.status(400).json({ error: 'Team ID is required.' });
    }

    // groupId can be null to unassign a team
    const sql = `UPDATE teams SET group_id = ? WHERE id = ?`;
    db.run(sql, [groupId, teamId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Team not found.' });
        }
        res.json({ message: `Team ${teamId} assigned to group ${groupId}` });
    });
});
module.exports = router;

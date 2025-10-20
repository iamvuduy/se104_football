const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all schedules
router.get('/', (req, res) => {
    db.all(`
        SELECT 
            s.id, 
            s.round, 
            s.matchOrder, 
            s.team1_id,
            t1.name AS team1, 
            s.team2_id,
            t2.name AS team2, 
            s.date, 
            s.time, 
            s.stadium 
        FROM schedules s
        JOIN teams t1 ON s.team1_id = t1.id
        JOIN teams t2 ON s.team2_id = t2.id
    `, [], (err, rows) => {
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

// Get schedule by id
router.get('/:id', (req, res) => {
    db.get(`
        SELECT 
            s.id, 
            s.round, 
            s.matchOrder, 
            s.team1_id,
            t1.name AS team1, 
            s.team2_id,
            t2.name AS team2, 
            s.date, 
            s.time, 
            s.stadium 
        FROM schedules s
        JOIN teams t1 ON s.team1_id = t1.id
        JOIN teams t2 ON s.team2_id = t2.id
        WHERE s.id = ?
    `, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: row
        });
    });
});


// Create a new schedule
router.post('/', (req, res) => {
    const { round, matchOrder, team1_id, team2_id, date, time, stadium } = req.body;
    db.run(`
        INSERT INTO schedules (round, matchOrder, team1_id, team2_id, date, time, stadium)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [round, matchOrder, team1_id, team2_id, date, time, stadium], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: { id: this.lastID }
        });
    });
});

// Update a schedule
router.put('/:id', (req, res) => {
    const { round, matchOrder, team1_id, team2_id, date, time, stadium } = req.body;
    db.run(`
        UPDATE schedules
        SET round = ?, matchOrder = ?, team1_id = ?, team2_id = ?, date = ?, time = ?, stadium = ?
        WHERE id = ?
    `, [round, matchOrder, team1_id, team2_id, date, time, stadium, req.params.id], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', changes: this.changes });
    });
});

// Delete a schedule
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM schedules WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

module.exports = router;
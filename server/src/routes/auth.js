const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const JWT_SECRET = 'your_super_secret_key_change_this'; // Change this to an environment variable in production

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Check if user already exists
    db.get(`SELECT username FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error on user check.', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({ message: 'Error hashing password.', error: err.message });
            }

            // Insert user into database
            db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Database error on user creation.', error: err.message });
                }
                res.status(201).json({ message: `User ${username} created successfully.` });
            });
        });
    });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error comparing passwords.' });
            }
            if (!result) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // Passwords match, create JWT
            const payload = {
                id: user.id,
                username: user.username,
                role: user.role
            };

            jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    return res.status(500).json({ message: 'Error signing token.' });
                }
                res.json({
                    message: 'Logged in successfully.',
                    token: token
                });
            });
        });
    });
});

module.exports = router;

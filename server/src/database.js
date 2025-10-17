const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Construct an absolute path to the database file
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');

// Connect to the database file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create tables if they don't exist
        db.serialize(() => {
            // Teams table
            db.run(`
                CREATE TABLE IF NOT EXISTS teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    home_stadium TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating teams table', err.message);
            });

            // Players table
            db.run(`
                CREATE TABLE IF NOT EXISTS players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    dob TEXT NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('Trong nước', 'Ngoài nước')),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating players table', err.message);
            });

            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user'
                )
            `, (err) => {
                if (err) console.error('Error creating users table', err.message);
            });

            // Insert admin user if not exists
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const adminPassword = 'admin';

            db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (err, row) => {
                if (err) {
                    return console.error('Error checking for admin user', err.message);
                }
                if (!row) {
                    bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
                        if (err) {
                            return console.error('Error hashing password', err.message);
                        }
                        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hash, 'admin'], (err) => {
                            if (err) {
                                return console.error('Error inserting admin user', err.message);
                            }
                            console.log('Admin user created successfully.');
                        });
                    });
                }
            });
        });
    }
});

module.exports = db;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // Create groups table
    db.run(`
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating groups table:', err.message);
        } else {
            console.log('Table "groups" created or already exists.');
        }
    });

    // Add group_id to teams table
    db.run(`ALTER TABLE teams ADD COLUMN group_id INTEGER REFERENCES groups(id)`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column "group_id" already exists in "teams" table.');
            } else {
                console.error('Error adding group_id column to teams table:', err.message);
            }
        } else {
            console.log('Column "group_id" added to "teams" table.');
        }
    });

    // Create match_results table
    db.run(`
        CREATE TABLE IF NOT EXISTS match_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team1_id INTEGER NOT NULL,
            team2_id INTEGER NOT NULL,
            score TEXT NOT NULL,
            stadium TEXT,
            match_date TEXT NOT NULL,
            match_time TEXT NOT NULL,
            FOREIGN KEY (team1_id) REFERENCES teams(id),
            FOREIGN KEY (team2_id) REFERENCES teams(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating match_results table:', err.message);
        } else {
            console.log('Table "match_results" created or already exists.');
        }
    });

    // Create goals table
    db.run(`
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_result_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            goal_type TEXT NOT NULL CHECK(goal_type IN ('A', 'B', 'C')),
            goal_time INTEGER NOT NULL,
            FOREIGN KEY (match_result_id) REFERENCES match_results(id),
            FOREIGN KEY (player_id) REFERENCES players(id),
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating goals table:', err.message);
        } else {
            console.log('Table "goals" created or already exists.');
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Closed the database connection.');
});
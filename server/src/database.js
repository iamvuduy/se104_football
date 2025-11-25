const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Construct an absolute path to the database file
const dbPath = path.join(__dirname, "..", "database", "database.sqlite");

// Connect to the database file
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Create tables if they don't exist
    db.serialize(() => {
      // Teams table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_code TEXT UNIQUE,
          name TEXT NOT NULL UNIQUE,
          home_stadium TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
            `,
        (err) => {
          if (err) console.error("Error creating teams table", err.message);
        }
      );

      const ensureTeamCodeSupport = () => {
        db.all("PRAGMA table_info(teams)", (err, columns) => {
          if (err) {
            console.error("Error inspecting teams table", err.message);
            return;
          }

          const hasTeamCode = Array.isArray(columns)
            ? columns.some((column) => column.name === "team_code")
            : false;

          const addColumnAndBackfill = () => {
            db.run("ALTER TABLE teams ADD COLUMN team_code TEXT", (err) => {
              if (err && !/duplicate column name/i.test(err.message)) {
                console.error(
                  "Error adding team_code column to teams table",
                  err.message
                );
                return;
              }

              if (!err) {
                console.log('Column "team_code" added to teams table.');
              }

              db.run(
                `
                  UPDATE teams
                  SET team_code = 'FC' || substr('000' || id, -3)
                  WHERE team_code IS NULL
                    OR trim(team_code) = ''
                    OR team_code NOT GLOB 'FC[0-9][0-9][0-9]'
                `,
                (err) => {
                  if (err) {
                    console.error(
                      "Error backfilling team_code values",
                      err.message
                    );
                  }
                }
              );

              db.run(
                `CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code)`
              );
            });
          };

          if (!hasTeamCode) {
            addColumnAndBackfill();
          } else {
            db.run(
              `
                UPDATE teams
                SET team_code = 'FC' || substr('000' || id, -3)
                WHERE team_code IS NULL
                  OR trim(team_code) = ''
                  OR team_code NOT GLOB 'FC[0-9][0-9][0-9]'
              `,
              (err) => {
                if (err) {
                  console.error(
                    "Error backfilling existing team_code values",
                    err.message
                  );
                }
              }
            );

            db.run(
              `CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code)`
            );
          }
        });
      };

      ensureTeamCodeSupport();

      const ensureUserProfileColumns = () => {
        db.all("PRAGMA table_info(users)", (err, columns) => {
          if (err) {
            console.error("Error inspecting users table", err.message);
            return;
          }

          const columnNames = new Set(
            Array.isArray(columns) ? columns.map((column) => column.name) : []
          );

          const statements = [];
          if (!columnNames.has("full_name")) {
            statements.push("ALTER TABLE users ADD COLUMN full_name TEXT");
          }
          if (!columnNames.has("email")) {
            statements.push("ALTER TABLE users ADD COLUMN email TEXT");
          }
          if (!columnNames.has("dob")) {
            statements.push("ALTER TABLE users ADD COLUMN dob TEXT");
          }
          if (!columnNames.has("position")) {
            statements.push("ALTER TABLE users ADD COLUMN position TEXT");
          }

          const applyStatementsSequentially = (items, done) => {
            if (!items.length) {
              done();
              return;
            }
            const [current, ...rest] = items;
            db.run(current, (runErr) => {
              if (
                runErr &&
                !/duplicate column name/i.test(String(runErr.message || ""))
              ) {
                console.error(
                  `Error updating users table with statement "${current}"`,
                  runErr.message
                );
              }
              applyStatementsSequentially(rest, done);
            });
          };

          applyStatementsSequentially(statements, () => {
            db.run(
              "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)"
            );
            db.run(
              `
                UPDATE users
                SET
                  full_name = CASE
                    WHEN full_name IS NULL OR trim(full_name) = '' THEN username
                    ELSE full_name
                  END,
                  email = CASE
                    WHEN email IS NULL OR trim(email) = '' THEN lower(username) || '@example.com'
                    ELSE lower(email)
                  END,
                  dob = CASE
                    WHEN dob IS NULL OR trim(dob) = '' THEN '1970-01-01'
                    ELSE dob
                  END,
                  position = CASE
                    WHEN position IS NULL OR trim(position) = '' THEN
                      CASE WHEN username = 'admin' THEN 'Ban tổ chức giải' ELSE 'Khán giả' END
                    ELSE position
                  END
              `
            );
          });
        });
      };

      // Players table
      db.run(
        `
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
            `,
        (err) => {
          if (err) console.error("Error creating players table", err.message);
        }
      );

      // Users table
      db.run(
        `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user'
                )
            `,
        (err) => {
          if (err) {
            console.error("Error creating users table", err.message);
            return;
          }
          ensureUserProfileColumns();
        }
      );

      // Settings table
      db.run(
        `
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `,
        (err) => {
          if (err) console.error("Error creating settings table", err.message);
        }
      );

      // Schedules table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_code TEXT NOT NULL,
          round TEXT NOT NULL,
          matchOrder INTEGER NOT NULL,
          team1_id INTEGER NOT NULL,
          team2_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          stadium TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team1_id) REFERENCES teams(id),
          FOREIGN KEY (team2_id) REFERENCES teams(id)
        )
            `,
        (err) => {
          if (err) console.error("Error creating schedules table", err.message);
        }
      );

      // Insert admin user if not exists
      const bcrypt = require("bcrypt");
      const saltRounds = 10;
      const adminPassword = "admin";

      db.get(
        `SELECT * FROM users WHERE username = ?`,
        ["admin"],
        (err, row) => {
          if (err) {
            return console.error("Error checking for admin user", err.message);
          }
          if (!row) {
            bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
              if (err) {
                return console.error("Error hashing password", err.message);
              }
              db.run(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                ["admin", hash, "admin"],
                (err) => {
                  if (err) {
                    return console.error(
                      "Error inserting admin user",
                      err.message
                    );
                  }
                  console.log("Admin user created successfully.");
                }
              );
            });
          }
        }
      );
    });
  }
});

module.exports = db;

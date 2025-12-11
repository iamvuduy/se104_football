const db = require("../database");

/**
 * Initialize leaderboard_reports table if it doesn't exist
 */
const initializeReportsTable = () => {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS leaderboard_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round INTEGER NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        is_published INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        UNIQUE(round, type)
      )`,
      (err) => {
        if (err) {
          console.error("Error creating leaderboard_reports table:", err);
          reject(err);
        } else {
          console.log("leaderboard_reports table initialized successfully");
          resolve();
        }
      }
    );
  });
};

module.exports = {
  initializeReportsTable,
};

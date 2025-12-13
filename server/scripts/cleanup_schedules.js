const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../database/database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Delete all schedules
  db.run("DELETE FROM schedules", (err) => {
    if (err) {
      console.error("Error deleting schedules:", err);
    } else {
      console.log("✓ Deleted all schedules");
    }
  });

  // 2. Delete all results
  db.run("DELETE FROM results", (err) => {
    if (err) {
      console.error("Error deleting results:", err);
    } else {
      console.log("✓ Deleted all results");
    }
  });

  // 3. Verify
  db.all("SELECT COUNT(*) as count FROM schedules", (err, rows) => {
    if (err) {
      console.error("Error checking schedules:", err);
    } else {
      console.log(`✓ Remaining schedules: ${rows[0].count}`);
    }
  });

  db.all("SELECT COUNT(*) as count FROM results", (err, rows) => {
    if (err) {
      console.error("Error checking results:", err);
    } else {
      console.log(`✓ Remaining results: ${rows[0].count}`);
    }

    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("\n✓ Database cleanup completed successfully!");
      }
    });
  });
});

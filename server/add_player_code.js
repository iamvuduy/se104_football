const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Connected to:", dbPath);

db.serialize(() => {
  // Add player_code column
  db.run("ALTER TABLE players ADD COLUMN player_code TEXT UNIQUE", (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("Column 'player_code' already exists.");
      } else {
        console.error("Error adding column:", err.message);
      }
    } else {
      console.log("Column 'player_code' added successfully.");
    }
  });
});

db.close();

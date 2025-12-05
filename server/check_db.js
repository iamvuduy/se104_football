const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("Connected to:", dbPath);
  
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error("Error listing tables:", err);
      return;
    }
    console.log("Tables:", tables);
    
    if (tables.find(t => t.name === 'players')) {
        db.all("PRAGMA table_info(players)", (err, rows) => {
            if (err) {
                console.error("Error getting players schema:", err);
            } else {
                console.log("Players Schema:", rows);
            }
        });
    } else {
        console.log("Table 'players' not found.");
    }
  });
});

db.close();

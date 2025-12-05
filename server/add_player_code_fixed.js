const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to:', dbPath);
  
  db.serialize(() => {
    // Step 1: Add player_code column WITHOUT unique constraint
    db.run("ALTER TABLE players ADD COLUMN player_code TEXT", (err) => {
      if (err) {
        if (err.message.includes("duplicate column")) {
          console.log("Column 'player_code' already exists, skipping...");
        } else {
          console.error("Error adding column:", err.message);
          db.close();
          process.exit(1);
        }
      } else {
        console.log("✓ Column 'player_code' added successfully.");
      }
      
      // Step 2: Create UNIQUE index on player_code
      db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_player_code ON players(player_code)", (err) => {
        if (err) {
          console.error("Error creating unique index:", err.message);
        } else {
          console.log("✓ UNIQUE index on 'player_code' created successfully.");
        }
        
        db.close();
      });
    });
  });
});

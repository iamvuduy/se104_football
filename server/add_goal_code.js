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
    // Step 1: Add goal_code column
    db.run("ALTER TABLE goals ADD COLUMN goal_code TEXT", (err) => {
      if (err) {
        if (err.message.includes("duplicate column")) {
          console.log("Column 'goal_code' already exists, skipping...");
        } else {
          console.error("Error adding column:", err.message);
          db.close();
          process.exit(1);
        }
      } else {
        console.log("✓ Column 'goal_code' added successfully.");
      }
      
      // Step 2: Create UNIQUE index on goal_code
      db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_code ON goals(goal_code)", (err) => {
        if (err) {
          console.error("Error creating unique index:", err.message);
        } else {
          console.log("✓ UNIQUE index on 'goal_code' created successfully.");
        }
        
        db.close();
      });
    });
  });
});

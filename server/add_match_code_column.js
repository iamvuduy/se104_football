const db = require('./src/database');

console.log('Checking match_results table schema...\n');

db.all("PRAGMA table_info(match_results)", (err, columns) => {
  if (err) {
    console.error("ERROR:", err.message);
    db.close();
    return;
  }

  console.log("Current columns in match_results:");
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  const hasMatchCode = columns.some(col => col.name === 'match_code');
  
  if (!hasMatchCode) {
    console.log("\n❌ Missing 'match_code' column!");
    console.log("Adding match_code column...\n");
    
    db.run("ALTER TABLE match_results ADD COLUMN match_code TEXT", (err) => {
      if (err) {
        console.error("ERROR adding column:", err.message);
      } else {
        console.log("✅ Successfully added match_code column!");
      }
      db.close();
    });
  } else {
    console.log("\n✅ match_code column already exists!");
    db.close();
  }
});

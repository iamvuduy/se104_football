const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to:', dbPath);
  
  db.all("PRAGMA table_info(players)", (err, rows) => {
    if (err) {
      console.error('Error getting schema:', err);
      db.close();
      process.exit(1);
    }
    
    console.log('Players table columns:');
    rows.forEach(row => {
      console.log(`  ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    const hasPlayerCode = rows.some(row => row.name === 'player_code');
    console.log(`\nplayer_code column exists: ${hasPlayerCode}`);
    
    db.close();
  });
});

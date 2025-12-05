// Migration script to add player_code column to players table
const db = require('./src/database');

console.log('Checking and adding player_code column to players table...');

// Check if column exists
db.all("PRAGMA table_info(players)", [], (err, columns) => {
  if (err) {
    console.error('Error checking table info:', err.message);
    process.exit(1);
  }

  console.log('Current columns:', columns.map(c => c.name));

  const hasPlayerCode = columns.some(col => col.name === 'player_code');

  if (hasPlayerCode) {
    console.log('Column player_code already exists.');
    process.exit(0);
  }

  console.log('Adding player_code column...');
  db.run("ALTER TABLE players ADD COLUMN player_code TEXT", (err) => {
    if (err) {
      console.error('Error adding column:', err.message);
      process.exit(1);
    }
    console.log('Column player_code added successfully!');
    process.exit(0);
  });
});

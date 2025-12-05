const db = require('./src/database');

console.log('Testing database connection...');
console.log('DB object:', typeof db);
console.log('DB all method:', typeof db.all);

// Try a simple query
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error("ERROR:", err.message);
  } else {
    console.log("SUCCESS! Tables found:", tables.length);
    tables.forEach(t => console.log("  - ", t.name));
  }
  db.close();
});

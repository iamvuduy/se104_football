const db = require('./src/database');

db.all("PRAGMA table_info(schedules)", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.table(rows);
});

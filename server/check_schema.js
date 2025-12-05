const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.all("PRAGMA table_info(players)", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(rows);
  });
});

db.close();

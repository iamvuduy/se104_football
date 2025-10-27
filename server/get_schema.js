const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err.message);
            db.close();
            return;
        }

        const tableNames = tables.map(t => t.name).filter(name => name !== 'sqlite_sequence');
        let completed = 0;

        if (tableNames.length === 0) {
            db.close();
            return;
        }

        tableNames.forEach((tableName) => {
            console.log(`\nTable: ${tableName}`);
            db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                if (err) {
                    console.error(err.message);
                } else {
                    columns.forEach((column) => {
                        console.log(`  ${column.name}: ${column.type}`);
                    });
                }

                completed++;
                if (completed === tableNames.length) {
                    db.close();
                }
            });
        });
    });
});

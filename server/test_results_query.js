const db = require('./src/database');

console.log('Testing /api/results query...\n');

const sql = `
    SELECT 
        mr.id,
        mr.team1_id,
        mr.team2_id,
        t1.name AS team1_name,
        t2.name AS team2_name,
        mr.score,
        mr.stadium,
        mr.match_date,
        mr.match_time,
        mr.match_code
    FROM match_results mr
    JOIN teams t1 ON mr.team1_id = t1.id
    JOIN teams t2 ON mr.team2_id = t2.id
    ORDER BY mr.match_date DESC, mr.match_time DESC
`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error("❌ ERROR executing query:");
    console.error(err.message);
    console.error("\nThis is likely the cause of the 500 error!");
  } else {
    console.log(`✅ Query successful! Found ${rows.length} match results.`);
    if (rows.length > 0) {
      console.log("\nFirst match:");
      console.log(rows[0]);
    }
  }
  db.close();
});

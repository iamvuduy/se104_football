const db = require('./src/database');

console.log('Testing /api/leaderboard/teams query...\n');

// This is the typical query used by leaderboard endpoint
const sql = `
    SELECT 
        t.id,
        t.name,
        t.team_code,
        COUNT(DISTINCT mr.id) as played,
        SUM(CASE 
            WHEN (mr.team1_id = t.id AND CAST(SUBSTR(mr.score, 1, INSTR(mr.score, '-') - 1) AS INTEGER) > CAST(SUBSTR(mr.score, INSTR(mr.score, '-') + 1) AS INTEGER))
            OR (mr.team2_id = t.id AND CAST(SUBSTR(mr.score, INSTR(mr.score, '-') + 1) AS INTEGER) > CAST(SUBSTR(mr.score, 1, INSTR(mr.score, '-') - 1) AS INTEGER))
            THEN 1 ELSE 0 END) as won,
        SUM(CASE 
            WHEN CAST(SUBSTR(mr.score, 1, INSTR(mr.score, '-') - 1) AS INTEGER) = CAST(SUBSTR(mr.score, INSTR(mr.score, '-') + 1) AS INTEGER)
            THEN 1 ELSE 0 END) as drawn,
        SUM(CASE 
            WHEN (mr.team1_id = t.id AND CAST(SUBSTR(mr.score, 1, INSTR(mr.score, '-') - 1) AS INTEGER) < CAST(SUBSTR(mr.score, INSTR(mr.score, '-') + 1) AS INTEGER))
            OR (mr.team2_id = t.id AND CAST(SUBSTR(mr.score, INSTR(mr.score, '-') + 1) AS INTEGER) < CAST(SUBSTR(mr.score, 1, INSTR(mr.score, '-') - 1) AS INTEGER))
            THEN 1 ELSE 0 END) as lost
    FROM teams t
    LEFT JOIN match_results mr ON t.id = mr.team1_id OR t.id = mr.team2_id
    GROUP BY t.id
    ORDER BY won DESC
    LIMIT 5
`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error("❌ ERROR executing leaderboard query:");
    console.error(err.message);
  } else {
    console.log(`✅ Leaderboard query successful! Found ${rows.length} teams.`);
    if (rows.length > 0) {
      console.log("\nTop teams:");
      rows.forEach((team, i) => {
        console.log(`${i+1}. ${team.name} - P:${team.played} W:${team.won} D:${team.drawn} L:${team.lost}`);
      });
    }
  }
  db.close();
});

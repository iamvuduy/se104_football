const db = require('./src/database');

const sql = `
  SELECT 
    mr.id, 
    mr.match_date, 
    mr.score, 
    s.round,
    t1.name as team1,
    t2.name as team2,
    CAST(s.round AS INTEGER) as round_int
  FROM match_results mr
  LEFT JOIN schedules s ON (
    (mr.team1_id = s.team1_id AND mr.team2_id = s.team2_id) OR
    (mr.team1_id = s.team2_id AND mr.team2_id = s.team1_id)
  )
  JOIN teams t1 ON mr.team1_id = t1.id
  JOIN teams t2 ON mr.team2_id = t2.id
`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Match Data Inspection:");
  console.table(rows);
});

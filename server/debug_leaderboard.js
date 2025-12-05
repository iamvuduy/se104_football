const db = require('./src/database');

console.log('=== Checking teams ===');
db.all("SELECT id, name FROM teams WHERE name IN ('12A1', 'CE K18')", [], (err, teams) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Teams:', JSON.stringify(teams, null, 2));
  
  console.log('\n=== Checking all match_results ===');
  db.all("SELECT * FROM match_results ORDER BY id", [], (err, matches) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('Match Results:', JSON.stringify(matches, null, 2));
    
    console.log('\n=== Checking schedules for round <= 4 ===');
    db.all("SELECT * FROM schedules WHERE CAST(round AS INTEGER) <= 4 ORDER BY round, id", [], (err, schedules) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log('Schedules:', JSON.stringify(schedules, null, 2));
      
      console.log('\n=== Checking JOIN result (potential duplicates) ===');
      const sql = `
        SELECT mr.id as match_id, mr.match_code, mr.team1_id, mr.team2_id, mr.score, s.id as schedule_id, s.round
        FROM match_results mr 
        LEFT JOIN schedules s ON (
          (mr.team1_id = s.team1_id AND mr.team2_id = s.team2_id) OR
          (mr.team1_id = s.team2_id AND mr.team2_id = s.team1_id)
        )
        WHERE CAST(s.round AS INTEGER) > 0 AND CAST(s.round AS INTEGER) <= 4
        ORDER BY mr.id, s.round
      `;
      db.all(sql, [], (err, joinResults) => {
        if (err) {
          console.error('Error:', err);
          return;
        }
        console.log('JOIN Results:', JSON.stringify(joinResults, null, 2));
        
        // Count matches per team
        const teamMatchCount = {};
        joinResults.forEach(row => {
          teamMatchCount[row.team1_id] = (teamMatchCount[row.team1_id] || 0) + 1;
          teamMatchCount[row.team2_id] = (teamMatchCount[row.team2_id] || 0) + 1;
        });
        console.log('\n=== Team Match Count from JOIN ===');
        console.log('Team Match Count:', JSON.stringify(teamMatchCount, null, 2));
        
        db.close();
      });
    });
  });
});

const db = require('./src/database');

console.log('=== Checking ALL data in database ===\n');

db.all("SELECT * FROM teams ORDER BY id", [], (err, teams) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('=== ALL TEAMS ===');
  teams.forEach(t => console.log(`Team ID ${t.id}: ${t.name}`));
  
  console.log('\n=== ALL MATCH_RESULTS ===');
  db.all("SELECT * FROM match_results ORDER BY id", [], (err, matches) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    matches.forEach(m => {
      const team1 = teams.find(t => t.id === m.team1_id);
      const team2 = teams.find(t => t.id === m.team2_id);
      console.log(`Match ${m.id}: ${team1?.name} (${m.team1_id}) vs ${team2?.name} (${m.team2_id}) - Score: ${m.score}`);
    });
    
    console.log('\n=== ALL SCHEDULES (Round <= 4) ===');
    db.all("SELECT * FROM schedules WHERE CAST(round AS INTEGER) <= 4 ORDER BY round, id", [], (err, schedules) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      schedules.forEach(s => {
        const team1 = teams.find(t => t.id === s.team1_id);
        const team2 = teams.find(t => t.id === s.team2_id);
        console.log(`Schedule ${s.id} (Round ${s.round}): ${team1?.name} (${s.team1_id}) vs ${team2?.name} (${s.team2_id})`);
      });
      
      console.log('\n=== MATCHES WITH DISTINCT (Round <= 4) ===');
      const sql = `
        SELECT DISTINCT mr.* 
        FROM match_results mr
        LEFT JOIN schedules s ON (
          (mr.team1_id = s.team1_id AND mr.team2_id = s.team2_id) OR
          (mr.team1_id = s.team2_id AND mr.team2_id = s.team1_id)
        )
        WHERE CAST(s.round AS INTEGER) > 0 AND CAST(s.round AS INTEGER) <= 4
        ORDER BY mr.id
      `;
      
      db.all(sql, [], (err, filteredMatches) => {
        if (err) {
          console.error('Error:', err);
          return;
        }
        filteredMatches.forEach(m => {
          const team1 = teams.find(t => t.id === m.team1_id);
          const team2 = teams.find(t => t.id === m.team2_id);
          console.log(`Match ${m.id}: ${team1?.name} (${m.team1_id}) vs ${team2?.name} (${m.team2_id}) - Score: ${m.score}`);
        });
        
        db.close();
      });
    });
  });
});

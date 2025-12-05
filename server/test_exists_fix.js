const db = require('./src/database');

console.log('=== Testing EXISTS fix for round filtering ===\n');

// Test the new approach with EXISTS
const sql = `
  SELECT mr.* 
  FROM match_results mr
  WHERE EXISTS (
    SELECT 1 FROM schedules s
    WHERE (
      (mr.team1_id = s.team1_id AND mr.team2_id = s.team2_id) OR
      (mr.team1_id = s.team2_id AND mr.team2_id = s.team1_id)
    )
    AND CAST(s.round AS INTEGER) > 0
    AND CAST(s.round AS INTEGER) <= 4
  )
  ORDER BY mr.id
`;

db.all(sql, [], (err, matches) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('✓ Query returned', matches.length, 'unique matches\n');
  
  db.all("SELECT * FROM teams WHERE id IN (12, 14, 15)", [], (err, teams) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }
    
    const teamMap = {};
    teams.forEach(t => teamMap[t.id] = t.name);
    
    console.log('Matches returned:');
    matches.forEach(m => {
      console.log(`  Match ${m.id}: ${teamMap[m.team1_id]} (${m.team1_id}) vs ${teamMap[m.team2_id]} (${m.team2_id}) - ${m.score}`);
    });
    
    // Count matches per team
    const teamMatchCount = {};
    matches.forEach(match => {
      teamMatchCount[match.team1_id] = (teamMatchCount[match.team1_id] || 0) + 1;
      teamMatchCount[match.team2_id] = (teamMatchCount[match.team2_id] || 0) + 1;
    });
    
    console.log('\n=== Team Match Count (After EXISTS Fix) ===');
    Object.keys(teamMatchCount).forEach(teamId => {
      console.log(`Team ${teamId} (${teamMap[teamId]}): ${teamMatchCount[teamId]} matches`);
    });
    
    console.log('\n=== Verification ===');
    const team14Count = teamMatchCount[14] || 0;
    const team15Count = teamMatchCount[15] || 0;
    console.log(`Team 14 (CE K18): ${team14Count} matches (Expected: 2 - matches 3 and 4)`);
    console.log(`Team 15 (12A1): ${team15Count} matches (Expected: 1 - match 4 only)`);
    
    // CE K18 played in match 3 and 4, so should be 2
    // 12A1 only played in match 4, so should be 1
    const success = (team14Count === 2) && (team15Count === 1);
    console.log('\n' + (success ? '✓ FIX SUCCESSFUL!' : '✗ FIX FAILED!'));
    
    if (!success) {
      console.log('\nExpected counts:');
      console.log('- CE K18 (14) should have 2 matches (in match 3 vs FC TTK, and match 4 vs 12A1)');
      console.log('- 12A1 (15) should have 1 match (in match 4 vs CE K18)');
    }
    
    db.close();
  });
});

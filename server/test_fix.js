const db = require('./src/database');

console.log('=== Testing DISTINCT fix for round filtering ===\n');

// Test the corrected query
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

db.all(sql, [], (err, matches) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('✓ Query returned', matches.length, 'unique matches\n');
  console.log('Matches:', JSON.stringify(matches, null, 2));
  
  // Count matches per team
  const teamMatchCount = {};
  matches.forEach(match => {
    teamMatchCount[match.team1_id] = (teamMatchCount[match.team1_id] || 0) + 1;
    teamMatchCount[match.team2_id] = (teamMatchCount[match.team2_id] || 0) + 1;
  });
  
  console.log('\n=== Team Match Count (After Fix) ===');
  console.log(JSON.stringify(teamMatchCount, null, 2));
  
  // Check specific teams
  console.log('\n=== Verification ===');
  console.log('Team 14 (CE K18) match count:', teamMatchCount[14] || 0, '(Expected: 1)');
  console.log('Team 15 (12A1) match count:', teamMatchCount[15] || 0, '(Expected: 1)');
  
  const success = (teamMatchCount[14] === 1) && (teamMatchCount[15] === 1);
  console.log('\n' + (success ? '✓ FIX SUCCESSFUL!' : '✗ FIX FAILED!'));
  
  db.close();
});

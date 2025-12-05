// Quick test to verify the API is returning correct data
const axios = require('axios');

async function testLeaderboardAPI() {
  try {
    console.log('Testing leaderboard API for round 4...\n');
    
    // Try without auth first (might work)
    try {
      const response = await axios.get('http://localhost:5000/api/leaderboard/teams?round=4');
      console.log('✓ API Response received\n');
      
      const leaderboard = response.data.leaderboard;
      console.log('Teams in leaderboard:');
      leaderboard.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name}: ${team.mp} matches, ${team.pts} points`);
      });
      
      // Check specific teams
      const team12A1 = leaderboard.find(t => t.name === '12A1');
      const teamCEK18 = leaderboard.find(t => t.name === 'CE K18');
      
      console.log('\n=== Critical Check ===');
      console.log(`12A1: ${team12A1?.mp || 0} matches (Expected: 1)`);
      console.log(`CE K18: ${teamCEK18?.mp || 0} matches (Expected: 2)`);
      
      const isCorrect = (team12A1?.mp === 1) && (teamCEK18?.mp === 2);
      console.log('\n' + (isCorrect ? '✓ API IS CORRECT!' : '✗ API STILL HAS BUG!'));
      
      if (!isCorrect) {
        console.log('\nFull API response:');
        console.log(JSON.stringify(response.data, null, 2));
      }
    } catch (authError) {
      if (authError.response?.status === 401 || authError.response?.status === 403) {
        console.log('⚠ API requires authentication');
        console.log('Need to login first to test API');
        
        // Try to login
        console.log('\nAttempting to login as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          username: 'admin',
          password: 'admin'
        });
        
        const token = loginResponse.data.token;
        console.log('✓ Login successful\n');
        
        // Retry with token
        const response = await axios.get('http://localhost:5000/api/leaderboard/teams?round=4', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✓ API Response received\n');
        
        const leaderboard = response.data.leaderboard;
        console.log('Teams in leaderboard:');
        leaderboard.forEach((team, index) => {
          console.log(`${index + 1}. ${team.name}: ${team.mp} matches, ${team.pts} points`);
        });
        
        // Check specific teams
        const team12A1 = leaderboard.find(t => t.name === '12A1');
        const teamCEK18 = leaderboard.find(t => t.name === 'CE K18');
        
        console.log('\n=== Critical Check ===');
        console.log(`12A1: ${team12A1?.mp || 0} matches (Expected: 1)`);
        console.log(`CE K18: ${teamCEK18?.mp || 0} matches (Expected: 2)`);
        
        const isCorrect = (team12A1?.mp === 1) && (teamCEK18?.mp === 2);
        console.log('\n' + (isCorrect ? '✓ API IS CORRECT!' : '✗ API STILL HAS BUG!'));
        
        if (!isCorrect) {
          console.log('\nFull API response:');
          console.log(JSON.stringify(response.data, null, 2));
        }
      } else {
        throw authError;
      }
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testLeaderboardAPI();

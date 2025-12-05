const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to:', dbPath);
  console.log('Generating goal codes for existing goals...\n');
  
  db.serialize(() => {
    // Get all goals without goal_code
    db.all('SELECT id FROM goals WHERE goal_code IS NULL ORDER BY id', [], (err, goals) => {
      if (err) {
        console.error('Error fetching goals:', err);
        db.close();
        process.exit(1);
      }
      
      if (goals.length === 0) {
        console.log('All goals already have goal codes.');
        db.close();
        return;
      }
      
      console.log(`Found ${goals.length} goals without goal codes.`);
      
      let processed = 0;
      const stmt = db.prepare('UPDATE goals SET goal_code = ? WHERE id = ?');
      
      goals.forEach((goal, index) => {
        // Generate goal code: G001, G002, G003, etc.
        const goalCode = `G${String(goal.id).padStart(3, '0')}`;
        
        stmt.run([goalCode, goal.id], (err) => {
          if (err) {
            console.error(`Error updating goal ${goal.id}:`, err.message);
          } else {
            processed++;
            console.log(`✓ Goal ${goal.id} → ${goalCode}`);
          }
          
          if (processed === goals.length) {
            stmt.finalize();
            console.log(`\n✓ Successfully generated ${processed} goal codes.`);
            db.close();
          }
        });
      });
    });
  });
});

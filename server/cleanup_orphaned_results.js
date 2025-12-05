const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Cleaning up orphaned match results and goals...\n');

db.serialize(() => {
  // Find all match_results that don't have a corresponding schedule
  db.all(
    `SELECT mr.id, mr.team1_id, mr.team2_id, mr.score, mr.match_date
     FROM match_results mr
     WHERE NOT EXISTS (
       SELECT 1 FROM schedules s 
       WHERE (s.team1_id = mr.team1_id AND s.team2_id = mr.team2_id)
          OR (s.team1_id = mr.team2_id AND s.team2_id = mr.team1_id)
     )`,
    [],
    (err, orphanedResults) => {
      if (err) {
        console.error('❌ Error finding orphaned results:', err);
        db.close();
        return;
      }

      console.log(`Found ${orphanedResults.length} orphaned match result(s):\n`);
      
      if (orphanedResults.length === 0) {
        console.log('✅ No orphaned data found. Database is clean!');
        db.close();
        return;
      }

      orphanedResults.forEach((result, index) => {
        console.log(`${index + 1}. Match Result ID: ${result.id}`);
        console.log(`   Teams: ${result.team1_id} vs ${result.team2_id}`);
        console.log(`   Score: ${result.score}`);
        console.log(`   Date: ${result.match_date}\n`);
      });

      const resultIds = orphanedResults.map(r => r.id);
      const placeholders = resultIds.map(() => '?').join(',');

      // Delete goals first
      db.run(
        `DELETE FROM goals WHERE match_result_id IN (${placeholders})`,
        resultIds,
        function(err) {
          if (err) {
            console.error('❌ Error deleting orphaned goals:', err);
            db.close();
            return;
          }

          console.log(`🗑️  Deleted ${this.changes} orphaned goal(s)`);

          // Delete match results
          db.run(
            `DELETE FROM match_results WHERE id IN (${placeholders})`,
            resultIds,
            function(err) {
              if (err) {
                console.error('❌ Error deleting orphaned match results:', err);
                db.close();
                return;
              }

              console.log(`🗑️  Deleted ${this.changes} orphaned match result(s)`);
              console.log('\n✅ Cleanup completed successfully!');
              console.log('📊 Leaderboard and top scorers will now be accurate.\n');
              
              db.close();
            }
          );
        }
      );
    }
  );
});

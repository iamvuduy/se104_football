const db = require('../src/database');

const updateRankingCriteria = () => {
  db.get("SELECT value FROM settings WHERE key = 'ranking_priority'", [], (err, row) => {
    if (err) {
      console.error("Error fetching settings:", err.message);
      return;
    }

    if (!row) {
      console.log("No ranking_priority setting found.");
      return;
    }

    try {
      let ranking = JSON.parse(row.value);
      console.log("Current ranking:", ranking);

      let updated = false;
      const newRanking = ranking.map(item => {
        if (item === 'goals_for') {
          updated = true;
          return 'away_goals';
        }
        return item;
      });

      if (!updated) {
        if (!newRanking.includes('away_goals')) {
             // If goals_for wasn't there, maybe we should just add away_goals if it's missing?
             // But the user specifically asked to replace "Bàn thắng" (goals_for).
             // If it's not there, maybe they meant "add it"?
             // For now, let's just replace if exists.
             console.log("'goals_for' not found in ranking criteria. No changes made.");
             return;
        } else {
             console.log("'away_goals' already exists. No changes needed.");
             return;
        }
      }
      
      // Remove duplicates just in case
      const uniqueRanking = [...new Set(newRanking)];

      console.log("New ranking:", uniqueRanking);

      db.run("UPDATE settings SET value = ? WHERE key = 'ranking_priority'", [JSON.stringify(uniqueRanking)], (updateErr) => {
        if (updateErr) {
          console.error("Error updating settings:", updateErr.message);
        } else {
          console.log("Successfully updated ranking criteria.");
        }
      });

    } catch (parseErr) {
      console.error("Error parsing settings:", parseErr.message);
    }
  });
};

// Wait a bit for db connection if needed, though sqlite is usually sync-ish for open
setTimeout(updateRankingCriteria, 1000);

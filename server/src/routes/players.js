const express = require("express");
const router = express.Router();
const db = require("../database");

// GET /api/players - Fetch all players with aggregated goal data
router.get("/", (req, res) => {
  const sql = `
        SELECT
            p.id,
            p.name AS playerName,
            p.player_code AS playerCode,
            p.type AS playerType,
            t.id AS teamId,
            t.name AS teamName,
            COUNT(g.id) AS totalGoals
        FROM players p
        JOIN teams t ON p.team_id = t.id
        LEFT JOIN goals g ON g.player_id = p.id
        GROUP BY p.id, p.name, p.player_code, p.type, t.id, t.name
    `;

  db.all(sql, [], (err, players) => {
    if (err) {
      console.error("Error fetching players:", err.message);
      return res.status(500).json({ error: "Failed to fetch players." });
    }

    let combinedData = players.map((player) => ({
      ...player,
      totalGoals: Number(player.totalGoals) || 0,
    }));

    const { team, type, search } = req.query;
    if (team) {
      combinedData = combinedData.filter((p) => p.teamName === team);
    }
    if (type) {
      combinedData = combinedData.filter((p) => p.playerType === type);
    }
    if (search) {
      const loweredSearch = search.toLowerCase();
      combinedData = combinedData.filter((p) =>
        p.playerName.toLowerCase().includes(loweredSearch)
      );
    }

    const { sort } = req.query;
    if (sort) {
      const [key, direction] = sort.split("_");
      combinedData.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    res.json({ message: "success", data: combinedData });
  });
});

module.exports = router;

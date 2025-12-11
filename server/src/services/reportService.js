const db = require("../database");

/**
 * Create or update a report for a round
 * @param {number} round - Round number
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @param {object} data - Report data
 * @returns {Promise<boolean>}
 */
const createOrUpdateReport = (round, type, data) => {
  return new Promise((resolve, reject) => {
    // First check if report exists
    db.get(
      `SELECT id FROM leaderboard_reports WHERE round = ? AND type = ?`,
      [round, type],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const now = new Date().toISOString();
        const reportData = JSON.stringify(data);

        if (row) {
          // Update existing report
          db.run(
            `UPDATE leaderboard_reports 
             SET data = ?, updated_at = ?
             WHERE id = ?`,
            [reportData, now, row.id],
            function (err) {
              if (err) reject(err);
              else resolve(true);
            }
          );
        } else {
          // Create new report
          db.run(
            `INSERT INTO leaderboard_reports (round, type, data, is_published, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [round, type, reportData, false, now, now],
            function (err) {
              if (err) reject(err);
              else resolve(true);
            }
          );
        }
      }
    );
  });
};

/**
 * Get report for a round
 * @param {number} round - Round number
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @param {boolean} onlyPublished - Only get published reports (default true)
 * @returns {Promise<object|null>}
 */
const getReport = (round, type, onlyPublished = true) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM leaderboard_reports WHERE round = ? AND type = ?`;
    const params = [round, type];

    if (onlyPublished) {
      sql += ` AND is_published = 1`;
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        resolve({
          ...row,
          data: JSON.parse(row.data),
        });
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Publish a report
 * @param {number} round - Round number
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @returns {Promise<boolean>}
 */
const publishReport = (round, type) => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    db.run(
      `UPDATE leaderboard_reports 
       SET is_published = 1, published_at = ?
       WHERE round = ? AND type = ?`,
      [now, round, type],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

/**
 * Unpublish a report
 * @param {number} round - Round number
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @returns {Promise<boolean>}
 */
const unpublishReport = (round, type) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE leaderboard_reports 
       SET is_published = 0, published_at = NULL
       WHERE round = ? AND type = ?`,
      [round, type],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

/**
 * Get all published rounds for a report type
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @returns {Promise<array>}
 */
const getPublishedRounds = (type) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT round FROM leaderboard_reports 
       WHERE type = ? AND is_published = 1
       ORDER BY round ASC`,
      [type],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((r) => r.round));
        }
      }
    );
  });
};

/**
 * Delete a report
 * @param {number} round - Round number
 * @param {string} type - 'team_leaderboard' or 'top_scorer_leaderboard'
 * @returns {Promise<boolean>}
 */
const deleteReport = (round, type) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM leaderboard_reports WHERE round = ? AND type = ?`,
      [round, type],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

module.exports = {
  createOrUpdateReport,
  getReport,
  publishReport,
  unpublishReport,
  getPublishedRounds,
  deleteReport,
};

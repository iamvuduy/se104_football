const db = require("../database");

/**
 * Service để quản lý tự sinh ID cho:
 * - Mã đội (FC001, FC002, ...)
 * - Mã cầu thủ (P001, P002, ...)
 * - ID trận đấu (M001, M002, ...)
 * - Mã bàn thắng (G001, G002, ...)
 */

/**
 * Sinh mã đội tự động bằng cách tìm mã tiếp theo không bị trùng
 * Format: FC001, FC002, FC003, ...
 */
const generateTeamCode = () => {
  return new Promise((resolve, reject) => {
    // Tìm số cao nhất đã sử dụng trong mã đội
    db.get(
      `SELECT MAX(CAST(SUBSTR(team_code, 3) AS INTEGER)) as max_number FROM teams WHERE team_code LIKE 'FC%'`,
      [],
      (err, row) => {
        if (err) {
          reject(new Error(`Error finding max team code: ${err.message}`));
          return;
        }

        const maxNumber = row?.max_number || 0;
        console.log(
          "DEBUG idGenerator: Max team code number found:",
          maxNumber
        );
        const nextNumber = maxNumber + 1;
        const teamCode = `FC${String(nextNumber).padStart(3, "0")}`;
        console.log("DEBUG idGenerator: Generated team code:", teamCode);
        resolve(teamCode);
      }
    );
  });
};

/**
 * Sinh mã cầu thủ tự động bằng cách tìm mã tiếp theo không bị trùng
 * Format: P001, P002, P003, ...
 */
const generatePlayerCode = () => {
  return new Promise((resolve, reject) => {
    // Tìm số cao nhất đã sử dụng trong mã cầu thủ
    db.get(
      `SELECT MAX(CAST(SUBSTR(player_code, 2) AS INTEGER)) as max_number FROM players WHERE player_code LIKE 'P%'`,
      [],
      (err, row) => {
        if (err) {
          reject(new Error(`Error finding max player code: ${err.message}`));
          return;
        }

        const nextNumber = (row?.max_number || 0) + 1;
        const playerCode = `P${String(nextNumber).padStart(3, "0")}`;
        resolve(playerCode);
      }
    );
  });
};

/**
 * Sinh ID trận đấu tự động bằng cách tìm ID tiếp theo không bị trùng
 * Format: M001, M002, M003, ...
 */
const generateMatchId = () => {
  return new Promise((resolve, reject) => {
    // Tìm số cao nhất đã sử dụng trong ID trận (từ cả bảng schedules và match_results)
    const querySchedule = `SELECT MAX(CAST(SUBSTR(match_code, 2) AS INTEGER)) as max_number FROM schedules WHERE match_code LIKE 'M%'`;
    const queryResult = `SELECT MAX(CAST(SUBSTR(match_code, 2) AS INTEGER)) as max_number FROM match_results WHERE match_code LIKE 'M%'`;

    db.get(querySchedule, [], (err, rowSchedule) => {
      if (err) {
        reject(
          new Error(`Error finding max match id in schedules: ${err.message}`)
        );
        return;
      }

      db.get(queryResult, [], (err, rowResult) => {
        if (err) {
          reject(
            new Error(`Error finding max match id in results: ${err.message}`)
          );
          return;
        }

        const maxSchedule = rowSchedule?.max_number || 0;
        const maxResult = rowResult?.max_number || 0;
        const maxNumber = Math.max(maxSchedule, maxResult);

        const nextNumber = maxNumber + 1;
        const matchId = `M${String(nextNumber).padStart(3, "0")}`;
        resolve(matchId);
      });
    });
  });
};

/**
 * Sinh mã bàn thắng tự động bằng cách tìm mã tiếp theo không bị trùng
 * Format: G001, G002, G003, ...
 */
const generateGoalCode = () => {
  return new Promise((resolve, reject) => {
    // Tìm số cao nhất đã sử dụng trong mã bàn thắng
    db.get(
      `SELECT MAX(CAST(SUBSTR(goal_code, 2) AS INTEGER)) as max_number FROM goals WHERE goal_code LIKE 'G%'`,
      [],
      (err, row) => {
        if (err) {
          reject(new Error(`Error finding max goal code: ${err.message}`));
          return;
        }

        const nextNumber = (row?.max_number || 0) + 1;
        const goalCode = `G${String(nextNumber).padStart(3, "0")}`;
        resolve(goalCode);
      }
    );
  });
};

/**
 * Kiểm tra xem team code đã tồn tại chưa
 */
const isTeamCodeExists = (teamCode) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM teams WHERE team_code = ?",
      [teamCode],
      (err, row) => {
        if (err) {
          reject(new Error(`Error checking team code: ${err.message}`));
          return;
        }
        resolve(!!row);
      }
    );
  });
};

/**
 * Kiểm tra xem player code đã tồn tại chưa
 */
const isPlayerCodeExists = (playerCode) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM players WHERE player_code = ?",
      [playerCode],
      (err, row) => {
        if (err) {
          reject(new Error(`Error checking player code: ${err.message}`));
          return;
        }
        resolve(!!row);
      }
    );
  });
};

/**
 * Kiểm tra xem match code đã tồn tại chưa
 */
const isMatchCodeExists = (matchCode) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM schedules WHERE match_code = ?",
      [matchCode],
      (err, row) => {
        if (err) {
          reject(new Error(`Error checking match code: ${err.message}`));
          return;
        }
        resolve(!!row);
      }
    );
  });
};

module.exports = {
  generateTeamCode,
  generatePlayerCode,
  generateMatchId,
  generateGoalCode,
  isTeamCodeExists,
  isPlayerCodeExists,
  isMatchCodeExists,
};

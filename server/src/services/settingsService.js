const db = require("../database");

const DEFAULT_SETTINGS = {
  player_min_age: 16,
  player_max_age: 40,
  team_min_players: 11,
  team_max_players: 25,
  foreign_player_limit: 3,
  goal_types: ["Bàn thường", "Phạt đền", "Phản lưới"],
  goal_time_limit: 90,
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  ranking_priority: ["points", "goal_difference", "goals_for", "head_to_head"],
};

const RANKING_OPTIONS = new Set([
  "points",
  "goal_difference",
  "goals_for",
  "goals_against",
  "away_goals",
  "head_to_head",
]);

const numericKeys = [
  "player_min_age",
  "player_max_age",
  "team_min_players",
  "team_max_players",
  "foreign_player_limit",
  "goal_time_limit",
  "points_win",
  "points_draw",
  "points_loss",
];

const arrayKeys = ["goal_types", "ranking_priority"];

const serializeValue = (value) => JSON.stringify(value);

const parseValue = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return text;
  }
};

const ensureDefaultSettings = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      );
      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        stmt.run(key, serializeValue(value));
      });
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const loadSettings = async () => {
  await ensureDefaultSettings();
  return new Promise((resolve, reject) => {
    db.all("SELECT key, value FROM settings", [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const result = { ...DEFAULT_SETTINGS };
      rows.forEach((row) => {
        result[row.key] = parseValue(row.value);
      });
      numericKeys.forEach((key) => {
        const parsed = Number(result[key]);
        result[key] =
          Number.isFinite(parsed) && parsed >= 0
            ? parsed
            : DEFAULT_SETTINGS[key];
      });
      if (!Array.isArray(result.goal_types) || result.goal_types.length === 0) {
        result.goal_types = [...DEFAULT_SETTINGS.goal_types];
      } else {
        result.goal_types = result.goal_types
          .map((item) => String(item).trim())
          .filter(
            (item, index, arr) => item.length > 0 && arr.indexOf(item) === index
          );
        if (result.goal_types.length === 0) {
          result.goal_types = [...DEFAULT_SETTINGS.goal_types];
        }
      }

      if (
        !Array.isArray(result.ranking_priority) ||
        result.ranking_priority.length === 0
      ) {
        result.ranking_priority = [...DEFAULT_SETTINGS.ranking_priority];
      } else {
        result.ranking_priority = result.ranking_priority.filter(
          (item, index, arr) =>
            RANKING_OPTIONS.has(item) && arr.indexOf(item) === index
        );
        if (result.ranking_priority.length === 0) {
          result.ranking_priority = [...DEFAULT_SETTINGS.ranking_priority];
        }
      }
      resolve(result);
    });
  });
};

const saveSettings = (settings) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      );
      Object.entries(settings).forEach(([key, value]) => {
        stmt.run(key, serializeValue(value));
      });
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const resetSettings = () => saveSettings(DEFAULT_SETTINGS);

module.exports = {
  DEFAULT_SETTINGS,
  RANKING_OPTIONS,
  numericKeys,
  arrayKeys,
  ensureDefaultSettings,
  loadSettings,
  saveSettings,
  resetSettings,
};

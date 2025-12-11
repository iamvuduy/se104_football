const express = require("express");
const router = express.Router();
const admin = require("../middleware/admin");
const { FEATURE_DEFINITIONS } = require("../services/permissionsService");
const db = require("../database");

// Helper to read/write raw permissions JSON stored in settings
const SETTINGS_KEY = "feature_permissions";

const readStoredMatrix = () =>
  new Promise((resolve, reject) => {
    db.get(
      "SELECT value FROM settings WHERE key = ?",
      [SETTINGS_KEY],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        try {
          resolve(JSON.parse(row.value));
        } catch (e) {
          resolve(null);
        }
      }
    );
  });

const writeStoredMatrix = (matrix) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [SETTINGS_KEY, JSON.stringify(matrix)],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

// GET /api/roles - list available role keys and labels
router.get("/", admin, async (req, res) => {
  try {
    const matrix = (await readStoredMatrix()) || {};
    const roles = Object.keys(matrix).map((key) => ({ key }));
    res.json({ roles });
  } catch (err) {
    console.error("Failed to list roles:", err.message);
    res.status(500).json({ message: "Không thể lấy danh sách vai trò." });
  }
});

// POST /api/roles - create a new role
router.post("/", admin, async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res
      .status(400)
      .json({ message: "Tên vai trò không được để trống." });
  }
  const raw = String(name).trim();
  // create a key: lowercase, letters/numbers and underscores only
  const key = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "_")
    .slice(0, 60);

  try {
    const stored = (await readStoredMatrix()) || {};
    if (stored[key]) {
      return res.status(409).json({ message: "Vai trò đã tồn tại." });
    }

    // default permissions: false for all features
    const defaults = {};
    FEATURE_DEFINITIONS.forEach((f) => {
      defaults[f.key] = false;
    });

    const updated = { ...stored, [key]: defaults };
    await writeStoredMatrix(updated);
    res
      .status(201)
      .json({ message: "Đã tạo vai trò.", role: { key, name: raw } });
  } catch (err) {
    console.error("Failed to create role:", err.message);
    res.status(500).json({ message: "Không thể tạo vai trò." });
  }
});

// DELETE /api/roles/:key - delete role
router.delete("/:key", admin, async (req, res) => {
  const { key } = req.params;
  if (!key) return res.status(400).json({ message: "Thiếu key vai trò." });
  try {
    const stored = (await readStoredMatrix()) || {};
    if (!stored[key])
      return res.status(404).json({ message: "Vai trò không tồn tại." });
    const updated = { ...stored };
    delete updated[key];
    await writeStoredMatrix(updated);
    res.json({ message: "Đã xóa vai trò." });
  } catch (err) {
    console.error("Failed to delete role:", err.message);
    res.status(500).json({ message: "Không thể xóa vai trò." });
  }
});

module.exports = router;

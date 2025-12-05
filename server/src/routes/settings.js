const express = require("express");
const router = express.Router();
const admin = require("../middleware/admin");
const {
  DEFAULT_SETTINGS,
  RANKING_OPTIONS,
  numericKeys,
  arrayKeys,
  loadSettings,
  saveSettings,
  resetSettings,
} = require("../services/settingsService");

router.get("/", async (req, res) => {
  try {
    const data = await loadSettings();
    res.json({ message: "success", data });
  } catch (err) {
    console.error("Failed to fetch settings:", err.message);
    res.status(500).json({ error: "Không thể tải cài đặt giải đấu." });
  }
});

router.put("/", admin, async (req, res) => {
  const incoming = req.body?.settings;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Dữ liệu cài đặt không hợp lệ." });
  }

  const sanitized = { ...DEFAULT_SETTINGS };

  try {
    numericKeys.forEach((key) => {
      if (incoming[key] === undefined) {
        return;
      }
      const value = Number(incoming[key]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Giá trị của ${key} phải là số hợp lệ.`);
      }
      sanitized[key] = value;
    });

    if (sanitized.player_min_age > sanitized.player_max_age) {
      throw new Error("Tuổi tối thiểu phải nhỏ hơn tuổi tối đa.");
    }

    if (sanitized.team_min_players > sanitized.team_max_players) {
      throw new Error("Số cầu thủ tối thiểu phải nhỏ hơn tối đa.");
    }

    if (
      sanitized.points_win < sanitized.points_draw ||
      sanitized.points_draw < sanitized.points_loss
    ) {
      throw new Error("Điểm số phải giảm dần theo Thắng > Hòa > Thua.");
    }

    arrayKeys.forEach((key) => {
      if (incoming[key] === undefined) {
        return;
      }
      if (!Array.isArray(incoming[key])) {
        throw new Error(`Giá trị của ${key} phải là danh sách.`);
      }
      const items = incoming[key]
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
      if (items.length === 0) {
        throw new Error(`Danh sách ${key} không được để trống.`);
      }
      sanitized[key] = key === "goal_types" ? [...new Set(items)] : items;
    });

    sanitized.goal_types = sanitized.goal_types.map((type) =>
      type.length > 60 ? type.slice(0, 60) : type
    );

    if (incoming.ranking_priority) {
      incoming.ranking_priority.forEach((item) => {
        if (!RANKING_OPTIONS.has(item)) {
          throw new Error("Tiêu chí xếp hạng không hợp lệ.");
        }
      });
      const cleaned = incoming.ranking_priority.filter(
        (item, index, arr) => arr.indexOf(item) === index
      );
      if (cleaned.length === 0) {
        throw new Error("Phải có ít nhất một tiêu chí xếp hạng.");
      }
      
      // Enforce "points" as the first criterion
      if (cleaned[0] !== "points") {
        // Remove "points" if it exists elsewhere
        const withoutPoints = cleaned.filter(item => item !== "points");
        // Prepend "points"
        sanitized.ranking_priority = ["points", ...withoutPoints];
      } else {
        sanitized.ranking_priority = cleaned;
      }
    }
  } catch (validationErr) {
    return res.status(400).json({ error: validationErr.message });
  }

  try {
    await saveSettings(sanitized);
    res.json({ message: "Cập nhật quy định thành công!", data: sanitized });
  } catch (err) {
    console.error("Failed to save settings:", err.message);
    res.status(500).json({ error: "Không thể lưu cài đặt." });
  }
});

router.post("/reset", admin, async (req, res) => {
  try {
    await resetSettings();
    res.json({
      message: "Đã khôi phục quy định mặc định.",
      data: DEFAULT_SETTINGS,
    });
  } catch (err) {
    console.error("Failed to reset settings:", err.message);
    res.status(500).json({ error: "Không thể đặt lại cài đặt." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const admin = require("../middleware/admin");
const {
  FEATURE_DEFINITIONS,
  loadPermissions,
  savePermissions,
} = require("../services/permissionsService");

router.get("/", async (_req, res) => {
  try {
    const matrix = await loadPermissions();
    res.json({ features: FEATURE_DEFINITIONS, matrix });
  } catch (err) {
    console.error("Failed to load permissions:", err.message);
    res.status(500).json({ message: "Không thể tải cấu hình quyền truy cập." });
  }
});

router.put("/", admin, async (req, res) => {
  const incoming = req.body?.matrix;
  if (!incoming || typeof incoming !== "object") {
    return res
      .status(400)
      .json({ message: "Dữ liệu phân quyền không hợp lệ." });
  }

  try {
    const matrix = await savePermissions(incoming);
    res.json({
      message: "Đã cập nhật cấu hình quyền truy cập.",
      features: FEATURE_DEFINITIONS,
      matrix,
    });
  } catch (err) {
    console.error("Failed to save permissions:", err.message);
    res.status(500).json({ message: "Không thể lưu cấu hình quyền truy cập." });
  }
});

module.exports = router;

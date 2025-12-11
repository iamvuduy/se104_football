const db = require("../database");

/**
 * Middleware để kiểm tra xem user có phải là chủ đội của đội được yêu cầu không
 *
 * Cách sử dụng:
 * router.put("/:id", authMiddleware, teamOwnerMiddleware, updateTeamHandler)
 *
 * Yêu cầu:
 * - req.user phải tồn tại (từ authMiddleware)
 * - req.params.id phải chứa team_id
 * - Nếu user là team_owner, phải có team_id được thiết lập
 */
const teamOwnerMiddleware = (req, res, next) => {
  const teamId = req.params.id;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // System Admin và Tournament Admin có toàn quyền
  if (userRole === "system_admin" || userRole === "tournament_admin") {
    return next();
  }

  // Viewer không có quyền chỉnh sửa
  if (userRole === "viewer") {
    return res.status(403).json({
      error: "Bạn không có quyền quản lý các đội bóng.",
    });
  }

  // Team Owner chỉ có thể quản lý đội của mình
  if (userRole === "team_owner") {
    db.get(
      "SELECT id FROM users WHERE id = ? AND team_id = ?",
      [userId, teamId],
      (err, row) => {
        if (err) {
          console.error("Error checking team ownership:", err.message);
          return res.status(500).json({ error: "Database error." });
        }

        if (!row) {
          return res.status(403).json({
            error: "Bạn chỉ có quyền quản lý đội bóng của mình.",
          });
        }

        next();
      }
    );
  } else {
    return res.status(403).json({
      error: "Bạn không có quyền thực hiện thao tác này.",
    });
  }
};

module.exports = teamOwnerMiddleware;

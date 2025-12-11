const db = require("../database");

const SETTINGS_KEY = "feature_permissions";

const FEATURE_DEFINITIONS = [
  {
    key: "view_dashboard",
    label: "Trang chủ",
    description: "Truy cập bảng điều khiển tổng quan.",
  },
  {
    key: "view_teams",
    label: "Danh sách đội",
    description: "Xem danh sách đội bóng tham dự.",
  },
  {
    key: "register_team",
    label: "Đăng ký đội bóng",
    description: "Gửi hoặc duyệt hồ sơ đăng ký đội.",
  },
  {
    key: "manage_teams",
    label: "Quản lý đội bóng",
    description: "Chỉnh sửa, xóa và quản trị thông tin đội.",
  },
  {
    key: "view_players",
    label: "Tra cứu cầu thủ",
    description: "Xem thông tin cầu thủ và tìm kiếm nhanh.",
  },
  {
    key: "view_match_results",
    label: "Kết quả trận đấu",
    description: "Theo dõi các kết quả trận đấu đã diễn ra.",
  },
  {
    key: "view_leaderboards",
    label: "Bảng xếp hạng",
    description: "Xem bảng xếp hạng đội và cầu thủ.",
  },
  {
    key: "record_match_results",
    label: "Ghi nhận kết quả",
    description: "Nhập tỉ số và thông tin bàn thắng cho trận đấu.",
  },
  {
    key: "manage_schedules",
    label: "Quản lý lịch thi đấu",
    description: "Tạo, sắp xếp và cập nhật lịch thi đấu.",
  },
  {
    key: "manage_settings",
    label: "Cài đặt giải đấu",
    description: "Điều chỉnh quy định và cấu hình chung.",
  },
  {
    key: "manage_users",
    label: "Quản lý người dùng",
    description: "Cấp quyền và quản trị tài khoản hệ thống.",
  },
  {
    key: "create_reports",
    label: "Lập báo cáo",
    description: "Tạo, chỉnh sửa và chia sẻ báo cáo.",
  },
];

const ROLE_ORDER = ["system_admin", "tournament_admin", "team_owner", "viewer"];

const DEFAULT_PERMISSION_MATRIX = {
  viewer: {
    view_dashboard: true,
    view_teams: true,
    register_team: false,
    manage_teams: false,
    view_players: true,
    view_match_results: true,
    view_leaderboards: true,
    record_match_results: false,
    manage_schedules: false,
    manage_settings: false,
    manage_users: false,
    create_reports: false,
  },
  team_owner: {
    view_dashboard: true,
    view_teams: true,
    register_team: true,
    manage_teams: false,
    view_players: true,
    view_match_results: true,
    view_leaderboards: true,
    record_match_results: false,
    manage_schedules: false,
    manage_settings: false,
    manage_users: false,
    create_reports: false,
  },
  tournament_admin: {
    ...FEATURE_DEFINITIONS.reduce((acc, feature) => {
      acc[feature.key] = true;
      return acc;
    }, {}),
    manage_groups: true,
  },
  system_admin: {
    view_dashboard: false,
    view_teams: false,
    register_team: false,
    manage_teams: false,
    view_players: false,
    view_match_results: false,
    view_leaderboards: false,
    record_match_results: false,
    manage_schedules: false,
    manage_settings: false,
    manage_users: true,
  },
};

const readStoredMatrix = () =>
  new Promise((resolve, reject) => {
    db.get(
      "SELECT value FROM settings WHERE key = ?",
      [SETTINGS_KEY],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        try {
          const parsed = JSON.parse(row.value);
          resolve(parsed);
        } catch (parseErr) {
          resolve(null);
        }
      }
    );
  });

const writeMatrix = (matrix) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [SETTINGS_KEY, JSON.stringify(matrix)],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });

const ensureAllFeatures = (matrix) => {
  const result = {};
  // include default ROLE_ORDER plus any custom roles present in incoming matrix
  const incomingKeys =
    matrix && typeof matrix === "object" ? Object.keys(matrix) : [];
  const allRoles = Array.from(new Set([...ROLE_ORDER, ...incomingKeys]));

  allRoles.forEach((role) => {
    const defaults = DEFAULT_PERMISSION_MATRIX[role] || {};
    const input =
      matrix?.[role] && typeof matrix[role] === "object" ? matrix[role] : {};
    const combined = {};
    FEATURE_DEFINITIONS.forEach((feature) => {
      if (Object.prototype.hasOwnProperty.call(input, feature.key)) {
        combined[feature.key] = Boolean(input[feature.key]);
      } else if (Object.prototype.hasOwnProperty.call(defaults, feature.key)) {
        combined[feature.key] = Boolean(defaults[feature.key]);
      } else {
        combined[feature.key] = false;
      }
    });
    result[role] = combined;
  });
  return result;
};

const loadPermissions = async () => {
  const stored = await readStoredMatrix();
  if (!stored) {
    const defaults = ensureAllFeatures(DEFAULT_PERMISSION_MATRIX);
    await writeMatrix(defaults);
    return defaults;
  }
  const sanitized = ensureAllFeatures(stored);
  return sanitized;
};

const savePermissions = async (incomingMatrix) => {
  const sanitized = ensureAllFeatures(incomingMatrix);
  await writeMatrix(sanitized);
  return sanitized;
};

module.exports = {
  FEATURE_DEFINITIONS,
  ROLE_ORDER,
  DEFAULT_PERMISSION_MATRIX: ensureAllFeatures(DEFAULT_PERMISSION_MATRIX),
  loadPermissions,
  savePermissions,
};

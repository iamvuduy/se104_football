import { ROLES } from "./roles";

export const FEATURE_DEFINITIONS = [
  {
    key: "view_dashboard",
    label: "Trang chủ",
    description: "Truy cập bảng điều khiển tổng quan.",
  },
  {
    key: "view_teams",
    label: "Danh sách đội",
    description: "Xem thông tin đội bóng tham dự.",
  },
  {
    key: "register_team",
    label: "Đăng ký đội bóng",
    description: "Tạo hồ sơ đăng ký đội mới.",
  },
  {
    key: "manage_teams",
    label: "Quản lý đội bóng",
    description: "Chỉnh sửa, duyệt và xóa đội.",
  },
  {
    key: "view_players",
    label: "Tra cứu cầu thủ",
    description: "Tìm kiếm và xem chi tiết cầu thủ.",
  },
  {
    key: "view_match_results",
    label: "Kết quả trận đấu",
    description: "Theo dõi lịch sử các trận đã diễn ra.",
  },
  {
    key: "view_leaderboards",
    label: "Bảng xếp hạng",
    description: "Xem BXH đội và cầu thủ.",
  },
  {
    key: "record_match_results",
    label: "Ghi nhận kết quả",
    description: "Cập nhật tỉ số sau mỗi trận đấu.",
  },
  {
    key: "manage_schedules",
    label: "Quản lý lịch thi đấu",
    description: "Lập và điều chỉnh lịch thi đấu.",
  },
  {
    key: "manage_settings",
    label: "Cài đặt giải đấu",
    description: "Điều chỉnh quy định chung của giải.",
  },
  {
    key: "manage_users",
    label: "Quản lý người dùng",
    description: "Phân quyền và quản trị tài khoản.",
  },
  {
    key: "create_reports",
    label: "Lập báo cáo",
    description: "Tạo, chỉnh sửa và chia sẻ báo cáo.",
  },
];

export const ROLE_ORDER = [
  ROLES.SYSTEM_ADMIN,
  ROLES.TOURNAMENT_ADMIN,
  ROLES.TEAM_OWNER,
  ROLES.VIEWER,
];

const buildSystemAdminPermissions = () =>
  FEATURE_DEFINITIONS.reduce((acc, feature) => {
    acc[feature.key] = true;
    return acc;
  }, {});

export const DEFAULT_PERMISSION_MATRIX = {
  [ROLES.VIEWER]: {
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
  [ROLES.TEAM_OWNER]: {
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
  [ROLES.TOURNAMENT_ADMIN]: {
    ...buildSystemAdminPermissions(),
    manage_groups: true,
  },
  [ROLES.SYSTEM_ADMIN]: {
    ...buildSystemAdminPermissions(),
    manage_groups: true,
  },
};

export const sanitizePermissionMatrix = (matrix) => {
  const result = {};

  // Include both standard roles and any custom roles in the matrix
  const incomingKeys =
    matrix && typeof matrix === "object" ? Object.keys(matrix) : [];
  const allRoles = Array.from(new Set([...ROLE_ORDER, ...incomingKeys]));

  allRoles.forEach((role) => {
    const defaults = DEFAULT_PERMISSION_MATRIX[role] || {};
    const incoming =
      matrix && typeof matrix[role] === "object" ? matrix[role] : {};
    const merged = {};
    FEATURE_DEFINITIONS.forEach((feature) => {
      if (Object.prototype.hasOwnProperty.call(incoming, feature.key)) {
        merged[feature.key] = Boolean(incoming[feature.key]);
      } else if (Object.prototype.hasOwnProperty.call(defaults, feature.key)) {
        merged[feature.key] = Boolean(defaults[feature.key]);
      } else {
        merged[feature.key] = false;
      }
    });
    result[role] = merged;
  });
  return result;
};

export const hasFeatureAccess = (matrix, role, featureKey) => {
  if (!featureKey) {
    return true;
  }
  if (!role) {
    return false;
  }
  const sanitized = sanitizePermissionMatrix(matrix);
  const rolePermissions = sanitized[role];
  if (!rolePermissions) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(rolePermissions, featureKey)) {
    return Boolean(rolePermissions[featureKey]);
  }
  return Boolean(
    DEFAULT_PERMISSION_MATRIX[role] &&
      DEFAULT_PERMISSION_MATRIX[role][featureKey]
  );
};

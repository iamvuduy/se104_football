export const ROLES = {
  SYSTEM_ADMIN: "system_admin",
  TOURNAMENT_ADMIN: "tournament_admin",
  TEAM_OWNER: "team_owner",
  VIEWER: "viewer",
};

const LEGACY_ROLE_MAP = {
  admin: ROLES.SYSTEM_ADMIN,
  user: ROLES.TEAM_OWNER,
  viewer: ROLES.VIEWER,
};

const ROLE_INHERITANCE = {
  [ROLES.SYSTEM_ADMIN]: new Set([
    ROLES.SYSTEM_ADMIN,
    ROLES.TOURNAMENT_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.VIEWER,
  ]),
  [ROLES.TOURNAMENT_ADMIN]: new Set([
    ROLES.TOURNAMENT_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.VIEWER,
  ]),
  [ROLES.TEAM_OWNER]: new Set([ROLES.TEAM_OWNER, ROLES.VIEWER]),
  [ROLES.VIEWER]: new Set([ROLES.VIEWER]),
};

export const ROLE_LABELS = {
  [ROLES.SYSTEM_ADMIN]: "Quản trị hệ thống",
  [ROLES.TOURNAMENT_ADMIN]: "Ban điều hành giải",
  [ROLES.TEAM_OWNER]: "Chủ đội bóng",
  [ROLES.VIEWER]: "Người xem",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const resolveRole = (rawRole) => {
  if (!rawRole) {
    return ROLES.VIEWER;
  }
  const key = String(rawRole).trim().toLowerCase();
  if (LEGACY_ROLE_MAP[key]) {
    return LEGACY_ROLE_MAP[key];
  }
  if (ROLE_LABELS[key]) {
    return key;
  }
  return key;
};

export const hasRole = (userRole, requiredRoles = []) => {
  const normalized = resolveRole(userRole);
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  const allowedSet =
    ROLE_INHERITANCE[normalized] || ROLE_INHERITANCE[ROLES.VIEWER];
  return requiredRoles.some((role) => allowedSet.has(resolveRole(role)));
};

export const normalizeUserRole = (user) => {
  if (!user) {
    return user;
  }
  const normalizedRole = resolveRole(user.role);
  if (normalizedRole === user.role) {
    return user;
  }
  return { ...user, role: normalizedRole };
};

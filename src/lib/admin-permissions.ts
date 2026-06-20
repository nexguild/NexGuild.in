// Role groups for usePageGuard — ordered from most to least permissive
export const ADMIN_ROLES = {
  ALL:      ["owner", "admin", "reviewer", "finance", "support", "moderator"],
  UPPER:    ["owner", "admin"],
  REVIEW:   ["owner", "admin", "reviewer"],
  FINANCE:  ["owner", "admin", "finance"],
  SUPPORT:  ["owner", "admin", "support"],
  CONTENT:  ["owner", "admin", "reviewer", "moderator"],
  USERS:    ["owner", "admin", "reviewer", "support", "moderator"],
  ANNOUNCE: ["owner", "admin", "support", "moderator"],
} as const;

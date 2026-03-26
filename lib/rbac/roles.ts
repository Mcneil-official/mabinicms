/**
 * RBAC Roles Definition
 * Centralized role configuration for NagaCMS
 */

export enum RoleType {
  ADMIN = "admin",
  BARANGAY_HEALTH = "barangay_admin",
  WORK_HEALTH = "workers",
}

export enum RoleLabel {
  ADMIN = "System Administrator",
  BARANGAY_HEALTH = "Barangay Health Officer",
  WORK_HEALTH = "Health Worker",
}

export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
  [RoleType.ADMIN]: "Admin",
  [RoleType.BARANGAY_HEALTH]: "Barangay Health",
  [RoleType.WORK_HEALTH]: "Health Worker",
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  [RoleType.ADMIN]: "Full system access and administrative capabilities",
  [RoleType.BARANGAY_HEALTH]: "Oversee health workers and monitor barangay health indicators",
  [RoleType.WORK_HEALTH]: "Deliver health services and submit field records",
};

/**
 * Role Hierarchy
 * Higher number = higher privilege level
 */
export const ROLE_HIERARCHY: Record<RoleType, number> = {
  [RoleType.WORK_HEALTH]: 1,
  [RoleType.BARANGAY_HEALTH]: 2,
  [RoleType.ADMIN]: 3,
};

/**
 * Check if a role has higher privilege than another
 */
export function hasHigherPrivilege(role: RoleType, comparedToRole: RoleType): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[comparedToRole];
}

/**
 * Check if two roles are at the same level
 */
export function isSamePrivilegeLevel(role1: RoleType, role2: RoleType): boolean {
  return ROLE_HIERARCHY[role1] === ROLE_HIERARCHY[role2];
}

/**
 * Get all roles
 */
export function getAllRoles(): RoleType[] {
  return Object.values(RoleType);
}

/**
 * Validate if a string is a valid role
 */
export function isValidRole(role: unknown): role is RoleType {
  return Object.values(RoleType).includes(role as RoleType);
}

/**
 * Convert database role string to RoleType
 */
export function dbRoleToRoleType(dbRole: string): RoleType | null {
  const mapping: Record<string, RoleType> = {
    admin: RoleType.ADMIN,
    barangay_admin: RoleType.BARANGAY_HEALTH,
    workers: RoleType.WORK_HEALTH,
    staff: RoleType.BARANGAY_HEALTH, // Map staff to barangay health for backward compatibility
    user: RoleType.WORK_HEALTH, // Map user to work health for backward compatibility
  };
  return mapping[dbRole] || null;
}

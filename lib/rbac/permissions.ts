/**
 * Permission Matrix and Authorization Logic
 * Defines what each role can do in the system
 */

import { RoleType, ROLE_HIERARCHY } from "./roles";

export enum Permission {
  // Dashboard Access
  VIEW_ADMIN_DASHBOARD = "view_admin_dashboard",
  VIEW_BARANGAY_DASHBOARD = "view_barangay_dashboard",
  VIEW_WORKER_DASHBOARD = "view_worker_dashboard",
  VIEW_ANALYTICS = "view_analytics",
  VIEW_REPORTS = "view_reports",

  // Data Management
  CREATE_RECORDS = "create_records",
  EDIT_OWN_RECORDS = "edit_own_records",
  EDIT_ALL_RECORDS = "edit_all_records",
  DELETE_RECORDS = "delete_records",
  EXPORT_DATA = "export_data",
  VIEW_ALL_BARANGAYS = "view_all_barangays",

  // User Management
  MANAGE_USERS = "manage_users",
  ASSIGN_ROLES = "assign_roles",
  VIEW_AUDIT_LOGS = "view_audit_logs",
  VIEW_BARANGAY_USERS = "view_barangay_users",

  // Feature Access
  ACCESS_YAKAP = "access_yakap",
  ACCESS_VACCINES = "access_vaccines",
  ACCESS_MATERNAL_HEALTH = "access_maternal_health",
  ACCESS_BARANGAY_PROFILING = "access_barangay_profiling",
  ACCESS_HEALTH_FACILITIES = "access_health_facilities",
  ACCESS_ANNOUNCEMENTS = "access_announcements",
  ACCESS_APPOINTMENTS = "access_appointments",
  ACCESS_MEDICATIONS = "access_medications",
  MANAGE_STAFF = "manage_staff",

  // Record-specific
  SUBMIT_RECORDS = "submit_records",
  APPROVE_RECORDS = "approve_records",
  OVERRIDE_RECORDS = "override_records",
}

/**
 * Permission Matrix
 * Maps each role to its allowed permissions
 */
export const PERMISSION_MATRIX: Record<RoleType, Set<Permission>> = {
  [RoleType.ADMIN]: new Set([
    // Dashboard Access
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_REPORTS,

    // Data Management
    Permission.CREATE_RECORDS,
    Permission.EDIT_OWN_RECORDS,
    Permission.EDIT_ALL_RECORDS,
    Permission.DELETE_RECORDS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ALL_BARANGAYS,

    // User Management
    Permission.MANAGE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_BARANGAY_USERS,

    // Feature Access
    Permission.ACCESS_YAKAP,
    Permission.ACCESS_VACCINES,
    Permission.ACCESS_MATERNAL_HEALTH,
    Permission.ACCESS_BARANGAY_PROFILING,
    Permission.ACCESS_HEALTH_FACILITIES,
    Permission.ACCESS_ANNOUNCEMENTS,
    Permission.ACCESS_APPOINTMENTS,
    Permission.ACCESS_MEDICATIONS,
    Permission.MANAGE_STAFF,

    // Record-specific
    Permission.SUBMIT_RECORDS,
    Permission.APPROVE_RECORDS,
    Permission.OVERRIDE_RECORDS,
  ]),

  [RoleType.BARANGAY_HEALTH]: new Set([
    // Dashboard Access
    Permission.VIEW_BARANGAY_DASHBOARD,
    Permission.VIEW_WORKER_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_REPORTS,

    // Data Management
    Permission.CREATE_RECORDS,
    Permission.EDIT_OWN_RECORDS,
    Permission.EDIT_ALL_RECORDS,
    Permission.EXPORT_DATA,
    // Not: DELETE_RECORDS, VIEW_ALL_BARANGAYS

    // User Management
    Permission.VIEW_BARANGAY_USERS,
    Permission.VIEW_AUDIT_LOGS,
    // Not: MANAGE_USERS, ASSIGN_ROLES

    // Feature Access
    Permission.ACCESS_YAKAP,
    Permission.ACCESS_VACCINES,
    Permission.ACCESS_MATERNAL_HEALTH,
    Permission.ACCESS_BARANGAY_PROFILING,
    Permission.ACCESS_HEALTH_FACILITIES,
    Permission.ACCESS_ANNOUNCEMENTS,
    Permission.ACCESS_APPOINTMENTS,
    Permission.ACCESS_MEDICATIONS,

    // Record-specific
    Permission.SUBMIT_RECORDS,
    Permission.APPROVE_RECORDS,
    // Not: OVERRIDE_RECORDS
  ]),

  [RoleType.WORK_HEALTH]: new Set([
    // Dashboard Access
    Permission.VIEW_WORKER_DASHBOARD,
    // Not: Admin, Barangay dashboards, Analytics, Reports

    // Data Management
    Permission.CREATE_RECORDS,
    Permission.EDIT_OWN_RECORDS,
    // Not: EDIT_ALL_RECORDS, DELETE_RECORDS, EXPORT_DATA, VIEW_ALL_BARANGAYS

    // User Management - None (VIEW_BARANGAY_USERS only in perspective of seeing who they work with)

    // Feature Access
    Permission.ACCESS_YAKAP,
    Permission.ACCESS_VACCINES,
    Permission.ACCESS_MATERNAL_HEALTH,
    Permission.ACCESS_BARANGAY_PROFILING,
    Permission.ACCESS_APPOINTMENTS,

    // Record-specific
    Permission.SUBMIT_RECORDS,
    // Not: APPROVE_RECORDS, OVERRIDE_RECORDS
  ]),
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: RoleType, permission: Permission): boolean {
  const permissions = PERMISSION_MATRIX[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: RoleType, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: RoleType, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: RoleType): Permission[] {
  const permissions = PERMISSION_MATRIX[role];
  return permissions ? Array.from(permissions) : [];
}

/**
 * Check if a user can access a specific dashboard
 */
export function canAccessDashboard(role: RoleType, dashboardType: "admin" | "barangay" | "worker"): boolean {
  const dashboardPermissionMap: Record<string, Permission> = {
    admin: Permission.VIEW_ADMIN_DASHBOARD,
    barangay: Permission.VIEW_BARANGAY_DASHBOARD,
    worker: Permission.VIEW_WORKER_DASHBOARD,
  };

  const permission = dashboardPermissionMap[dashboardType];
  return permission ? hasPermission(role, permission) : false;
}

/**
 * Check if a user can perform an action on a record
 */
export function canEditRecord(role: RoleType, isOwnRecord: boolean): boolean {
  if (isOwnRecord) {
    return hasPermission(role, Permission.EDIT_OWN_RECORDS);
  } else {
    return hasPermission(role, Permission.EDIT_ALL_RECORDS);
  }
}

/**
 * Check if a user can delete records
 */
export function canDeleteRecords(role: RoleType): boolean {
  return hasPermission(role, Permission.DELETE_RECORDS);
}

/**
 * Check if a user can view data from all barangays
 */
export function canViewAllBarangays(role: RoleType): boolean {
  return hasPermission(role, Permission.VIEW_ALL_BARANGAYS);
}

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: RoleType): boolean {
  return role === RoleType.ADMIN;
}

/**
 * Check if a role is a supervisor role (can oversee workers)
 */
export function isSupervisorRole(role: RoleType): boolean {
  return role === RoleType.ADMIN || role === RoleType.BARANGAY_HEALTH;
}

/**
 * Check if a role is a field worker role
 */
export function isFieldWorkerRole(role: RoleType): boolean {
  return role === RoleType.WORK_HEALTH;
}

/**
 * Get dashboard routes for a role (in order of preference)
 */
export function getDashboardRoutes(role: RoleType): string[] {
  const routes: Record<RoleType, string[]> = {
    [RoleType.ADMIN]: ["/dashboard-admin", "/dashboard", "/dashboard-workers"],
    [RoleType.BARANGAY_HEALTH]: ["/dashboard-barangay", "/dashboard-workers", "/dashboard"],
    [RoleType.WORK_HEALTH]: ["/dashboard-workers", "/dashboard"],
  };
  return routes[role];
}

/**
 * Get the primary (home) dashboard route for a role
 */
export function getPrimaryDashboardRoute(role: RoleType): string {
  return getDashboardRoutes(role)[0];
}

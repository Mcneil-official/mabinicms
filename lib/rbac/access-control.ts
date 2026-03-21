/**
 * Data Access Control Utilities
 * Handles authorization logic for accessing specific data
 */

import { RoleType } from "./roles";
import { hasPermission, Permission, canViewAllBarangays } from "./permissions";

export interface UserContext {
  userId: string;
  role: RoleType;
  assignedBarangay?: string;
}

export interface DataResource {
  ownerId?: string;
  barangay?: string;
  createdBy?: string;
}

/**
 * Check if a user can view a specific data resource
 * @param user User context with role and barangay assignment
 * @param resource The resource being accessed
 * @returns true if user can view the resource
 */
export function canViewResource(user: UserContext, resource: DataResource): boolean {
  // Admin can view everything
  if (user.role === RoleType.ADMIN) {
    return true;
  }

  // Barangay Health can view data from their assigned barangay
  if (user.role === RoleType.BARANGAY_HEALTH) {
    if (!user.assignedBarangay) return false;
    return resource.barangay === user.assignedBarangay;
  }

  // Work Health can view data from their assigned barangay
  if (user.role === RoleType.WORK_HEALTH) {
    if (!user.assignedBarangay) return false;
    return resource.barangay === user.assignedBarangay;
  }

  return false;
}

/**
 * Check if a user can edit a specific data resource
 * @param user User context
 * @param resource The resource being edited
 * @returns true if user can edit the resource
 */
export function canEditResource(user: UserContext, resource: DataResource): boolean {
  // Check basic permission
  const isOwnRecord = resource.ownerId === user.userId || resource.createdBy === user.userId;

  if (!isOwnRecord && !hasPermission(user.role, Permission.EDIT_ALL_RECORDS)) {
    // User doesn't have permission to edit other's records
    return false;
  }

  if (isOwnRecord && !hasPermission(user.role, Permission.EDIT_OWN_RECORDS)) {
    // User doesn't have permission to edit own records
    return false;
  }

  // Check barangay scope
  return canViewResource(user, resource);
}

/**
 * Check if a user can delete a specific data resource
 * @param user User context
 * @param resource The resource being deleted
 * @returns true if user can delete the resource
 */
export function canDeleteResource(user: UserContext, resource: DataResource): boolean {
  if (!hasPermission(user.role, Permission.DELETE_RECORDS)) {
    return false;
  }

  // Only admin can delete without scope check
  if (user.role === RoleType.ADMIN) {
    return true;
  }

  // Other roles can't delete
  return false;
}

/**
 * Get a Supabase WHERE clause for filtering data based on user context
 * Used in queries to automatically filter data
 * @param user User context
 * @param barangayColumn Column name for barangay field (default: 'barangay')
 * @returns object with column_and_values filter or null for admin
 */
export function getDataScopeFilter(
  user: UserContext,
  barangayColumn = "barangay"
): { column: string; value: string } | null {
  // Admin can see all data
  if (user.role === RoleType.ADMIN) {
    return null;
  }

  // Barangay Health and Work Health can only see their assigned barangay
  if (user.assignedBarangay) {
    return {
      column: barangayColumn,
      value: user.assignedBarangay,
    };
  }

  // If no barangay assigned, restrict to empty result (return null)
  return { column: "id", value: "00000000-0000-0000-0000-000000000000" };
}

/**
 * Check if a user can manage (create/edit/delete) users in a barangay
 * @param user User context
 * @param targetBarangay The barangay of the user being managed
 * @returns true if user can manage the target user
 */
export function canManageBarangayUsers(user: UserContext, targetBarangay: string): boolean {
  // Admin can manage all users
  if (user.role === RoleType.ADMIN) {
    return true;
  }

  // Barangay Health can manage users in their assigned barangay
  if (user.role === RoleType.BARANGAY_HEALTH && user.assignedBarangay === targetBarangay) {
    return hasPermission(user.role, Permission.VIEW_BARANGAY_USERS);
  }

  return false;
}

/**
 * Check if a user can approve/override records
 * @param user User context
 * @param resource The resource being approved
 * @returns true if user can approve the resource
 */
export function canApproveResource(user: UserContext, resource: DataResource): boolean {
  if (!hasPermission(user.role, Permission.APPROVE_RECORDS)) {
    return false;
  }

  // Must be able to view the resource first
  return canViewResource(user, resource);
}

/**
 * Create a safe query filter for API routes
 * Usage: Apply this in `.eq()` or `.filter()` calls
 */
export function buildAccessFilter(user: UserContext) {
  if (user.role === RoleType.ADMIN) {
    return null; // No filter needed for admin
  }

  if (!user.assignedBarangay) {
    // If no barangay, return a filter that matches nothing
    return { field: "barangay", operator: "eq" as const, value: "RESTRICTED_NO_ACCESS" };
  }

  return { field: "barangay", operator: "eq" as const, value: user.assignedBarangay };
}

/**
 * Check if user can view an analytics/report
 * @param user User context
 * @param reportScope Scope of the report (single barangay or all)
 * @returns true if user can view the report
 */
export function canViewReport(
  user: UserContext,
  reportScope: "single_barangay" | "all_barangays"
): boolean {
  if (!hasPermission(user.role, Permission.VIEW_REPORTS)) {
    return false;
  }

  if (reportScope === "all_barangays") {
    return canViewAllBarangays(user.role);
  }

  return true;
}

/**
 * Get the audit log filter for a user viewing audit logs
 * @param user User context
 * @returns object for filtering audit logs by scope
 */
export function getAuditLogScope(user: UserContext) {
  if (user.role === RoleType.ADMIN) {
    return { scope: "all" as const };
  }

  if (user.role === RoleType.BARANGAY_HEALTH) {
    return { scope: "barangay" as const, barangay: user.assignedBarangay };
  }

  // Work Health can only see logs related to records they created
  return { scope: "own" as const, userId: user.userId };
}

/**
 * Enforce access control check and throw error if denied
 * Useful for API route handlers
 */
export function enforceAccess(user: UserContext, resource: DataResource, action: "view" | "edit" | "delete") {
  let canAccess = false;

  switch (action) {
    case "view":
      canAccess = canViewResource(user, resource);
      break;
    case "edit":
      canAccess = canEditResource(user, resource);
      break;
    case "delete":
      canAccess = canDeleteResource(user, resource);
      break;
  }

  if (!canAccess) {
    throw new Error(`Access denied: ${action} action not permitted for role ${user.role}`);
  }
}

/**
 * Get readable error message for access denial
 */
export function getAccessDenialMessage(role: RoleType, action: string, reason?: string): string {
  const roleDisplay = {
    [RoleType.ADMIN]: "Administrator",
    [RoleType.BARANGAY_HEALTH]: "Barangay Health Officer",
    [RoleType.WORK_HEALTH]: "Health Worker",
  }[role];

  if (reason === "barangay_mismatch") {
    return `Cannot ${action}. You can only access data from your assigned barangay.`;
  }

  return `You don't have permission to ${action} this resource. Contact your administrator if you believe this is an error.`;
}

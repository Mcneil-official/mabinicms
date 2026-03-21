/**
 * API Authorization Utilities
 * Centralized functions for protecting API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Permission, hasPermission } from "@/lib/rbac/permissions";
import { RoleType, dbRoleToRoleType } from "@/lib/rbac/roles";
import { canViewResource, canEditResource, UserContext, DataResource } from "@/lib/rbac/access-control";

/**
 * Require authentication on an API route
 * Returns error response if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return {
      isAuthenticated: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    isAuthenticated: true,
    session,
    session: session,
  };
}

/**
 * Require a specific role on an API route
 */
export async function requireRole(request: NextRequest, requiredRole: RoleType) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleType = dbRoleToRoleType(session.user.role);

  if (!roleType || roleType !== requiredRole) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Require any of multiple roles
 */
export async function requireAnyRole(request: NextRequest, requiredRoles: RoleType[]) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleType = dbRoleToRoleType(session.user.role);

  if (!roleType || !requiredRoles.includes(roleType)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Require a specific permission
 */
export async function requirePermission(request: NextRequest, permission: Permission) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleType = dbRoleToRoleType(session.user.role);

  if (!roleType || !hasPermission(roleType, permission)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Require barangay scope access
 * Useful for CHO accessing only their barangay data
 */
export async function requireBarangayScope(request: NextRequest) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleType = dbRoleToRoleType(session.user.role);

  // Admin can access all barangays
  if (roleType === RoleType.ADMIN) {
    return {
      authorized: true,
      session,
      barangayScope: null, // No scope restriction
    };
  }

  // Others need assigned barangay
  if (!session.user.assigned_barangay) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Forbidden: User has no assigned barangay" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    barangayScope: session.user.assigned_barangay,
  };
}

/**
 * Check data access for a specific resource
 */
export async function requireDataAccess(
  request: NextRequest,
  resource: DataResource,
  action: "view" | "edit" | "delete"
) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleType = dbRoleToRoleType(session.user.role);

  if (!roleType) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Invalid user role" }, { status: 400 }),
    };
  }

  const userContext: UserContext = {
    userId: session.user.id,
    role: roleType,
    assignedBarangay: session.user.assigned_barangay,
  };

  let canAccess = false;

  switch (action) {
    case "view":
      canAccess = canViewResource(userContext, resource);
      break;
    case "edit":
      canAccess = canEditResource(userContext, resource);
      break;
    case "delete":
      // Would need similar function in access-control.ts
      canAccess = false;
      break;
  }

  if (!canAccess) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: `Forbidden: Cannot ${action} this resource` },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Example usage in an API route:
 *
 * export async function GET(request: NextRequest) {
 *   // Require authentication
 *   const auth = await requireAuth(request);
 *   if (!auth.isAuthenticated) return auth.error;
 *
 *   // Require specific permission
 *   const perm = await requirePermission(request, Permission.VIEW_ANALYTICS);
 *   if (!perm.authorized) return perm.error;
 *
 *   // Require barangay scope
 *   const scope = await requireBarangayScope(request);
 *   if (!scope.authorized) return scope.error;
 *
 *   // Process request with scope.barangayScope to filter data
 *   const data = await fetchData(scope.barangayScope);
 *   return createSuccessResponse(data);
 * }
 */

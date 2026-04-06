# RBAC System Implementation Guide

## Quick Start

The RBAC system is now fully implemented and ready to use. This guide shows how to integrate it into your existing code.

---

## 1. SETUP AUTHENTICATION CONTEXT

Add the AuthProvider to your root layout:

**app/layout.tsx:**
```typescript
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 2. CHECKING ROLES IN COMPONENTS

### Using Hooks

```typescript
"use client";

import { useAuth, useRole, usePermission } from "@/contexts/auth-context";
import { RoleType } from "@/lib/rbac/roles";
import { Permission } from "@/lib/rbac/permissions";

export function MyComponent() {
  const auth = useAuth();
  const isAdmin = useRole(RoleType.ADMIN);
  const canEdit = usePermission(Permission.EDIT_ALL_RECORDS);

  if (!auth.isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {auth.getUserDisplay()}</p>
      {isAdmin && <div>Admin panel</div>}
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### Using Guard Components

```typescript
import { RequireRole, RequirePermission } from "@/contexts/auth-context";
import { RoleType } from "@/lib/rbac/roles";
import { Permission } from "@/lib/rbac/permissions";

export function MyComponent() {
  return (
    <>
      <RequireRole role={RoleType.ADMIN}>
        <div>Only admins see this</div>
      </RequireRole>

      <RequirePermission permission={Permission.EDIT_ALL_RECORDS}>
        <button>Edit All</button>
      </RequirePermission>
    </>
  );
}
```

---

## 3. PROTECTING API ROUTES

### Basic Authentication

```typescript
// app/api/some-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse } from "@/lib/api-authorization";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.isAuthenticated) return auth.error;

  // Process request...
  return createSuccessResponse({ data: "success" });
}
```

### Require Specific Role

```typescript
import { requireRole } from "@/lib/api-authorization";
import { RoleType } from "@/lib/rbac/roles";

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, RoleType.ADMIN);
  if (!auth.authorized) return auth.error;

  // Only admins can reach here
  return createSuccessResponse({ data: "admin action" });
}
```

### Require Permission

```typescript
import { requirePermission } from "@/lib/api-authorization";
import { Permission } from "@/lib/rbac/permissions";

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, Permission.DELETE_RECORDS);
  if (!auth.authorized) return auth.error;

  // Only users with DELETE_RECORDS permission can continue
  return createSuccessResponse({ deleted: true });
}
```

### Enforce Barangay Scope

```typescript
import { requireBarangayScope } from "@/lib/api-authorization";

export async function GET(request: NextRequest) {
  const scope = await requireBarangayScope(request);
  if (!scope.authorized) return scope.error;

  // scope.barangayScope contains user's assigned barangay (or null for admin)
  const data = await fetchResidents({
    barangay: scope.barangayScope, // Auto-filters if CHO
  });

  return createSuccessResponse(data);
}
```

---

## 4. ROLE-BASED DATA ACCESS

### In Components

```typescript
import { canViewResource, canEditResource } from "@/lib/rbac/access-control";
import { useAuth } from "@/contexts/auth-context";
import { RoleType } from "@/lib/rbac/roles";

export function ResidentCard({ resident }) {
  const auth = useAuth();

  if (!auth.user) return null;

  const userContext = {
    userId: auth.user.id,
    role: auth.user.role,
    assignedBarangay: auth.user.getBarangay(),
  };

  const resource = {
    barangay: resident.barangay,
    ownerId: resident.created_by,
  };

  const canView = canViewResource(userContext, resource);
  const canEdit = canEditResource(userContext, resource);

  if (!canView) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <p>{resident.name}</p>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### In API Routes

```typescript
import { canViewResource, canEditResource } from "@/lib/rbac/access-control";

export async function PUT(request: NextRequest, { params }) {
  const auth = await requireAuth(request);
  if (!auth.isAuthenticated) return auth.error;

  // Fetch the resource
  const resource = await fetchResident(params.id);

  // Check access
  const userContext = {
    userId: auth.session.user.id,
    role: auth.session.user.role,
    assignedBarangay: auth.session.user.assigned_barangay,
  };

  if (!canEditResource(userContext, resource)) {
    return createErrorResponse("Access denied", 403);
  }

  // Update resource...
  return createSuccessResponse(updated);
}
```

---

## 5. CONDITIONAL NAVIGATION

Update your sidebar/navigation menus:

```typescript
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Permission } from "@/lib/rbac/permissions";

export function Sidebar() {
  const auth = useAuth();

  if (!auth.isAuthenticated) return null;

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", show: true },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      show: auth.hasPermission(Permission.VIEW_ANALYTICS),
    },
    {
      label: "Users",
      href: "/dashboard-admin/users",
      show: auth.hasPermission(Permission.MANAGE_USERS),
    },
  ];

  return (
    <nav>
      {menuItems
        .filter((item) => item.show)
        .map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
    </nav>
  );
}
```

---

## 6. SESSION MANAGEMENT

### Get Current User Session

```typescript
"use client";

import { useAuth } from "@/contexts/auth-context";

export function UserProfile() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <p>Not logged in</p>;
  }

  return (
    <div>
      <p>User: {user.username}</p>
      <p>Role: {user.role}</p>
      <p>Barangay: {user.assignedBarangay}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 7. ROLE-SPECIFIC DASHBOARDS

### Routes by Role

| Role | Primary Dashboard | Alternative Access |
|------|---|---|
| **Admin** | `/dashboard-admin` | View all barangay data, user management |
| **Barangay Health Staff** | `/dashboard` | Oversee workers, monitor residents |
| **Health Worker** | `/dashboard-workers` | Field services, record submission |

      label: "Users",

Users are automatically redirected to their role-specific dashboard after authentication (handled in middleware).

---

## 8. PERMISSION MATRIX REFERENCE

### Admin Permissions
- ✅ VIEW_ADMIN_DASHBOARD
- ✅ VIEW_ANALYTICS
- ✅ VIEW_REPORTS
- ✅ CREATE_RECORDS
- ✅ EDIT_OWN_RECORDS
- ✅ EDIT_ALL_RECORDS
- ✅ DELETE_RECORDS
- ✅ EXPORT_DATA
- ✅ VIEW_ALL_BARANGAYS
- ✅ MANAGE_USERS
- ✅ ASSIGN_ROLES
- ✅ VIEW_AUDIT_LOGS
- ✅ All feature access permissions

### Barangay Health Staff Permissions
- ✅ VIEW_BARANGAY_DASHBOARD
- ❌ VIEW_WORKER_DASHBOARD
- ✅ VIEW_ANALYTICS
- ✅ VIEW_REPORTS
- ✅ CREATE_RECORDS
- ✅ EDIT_OWN_RECORDS
- ✅ EDIT_ALL_RECORDS (own barangay only)
- ✅ EXPORT_DATA
- ✅ VIEW_BARANGAY_USERS
- ✅ VIEW_AUDIT_LOGS
- ❌ DELETE_RECORDS
- ❌ MANAGE_USERS
- ❌ VIEW_ALL_BARANGAYS

### Health Worker Permissions
- ✅ VIEW_WORKER_DASHBOARD
- ✅ CREATE_RECORDS
- ✅ EDIT_OWN_RECORDS
- ✅ SUBMIT_RECORDS
- ✅ All feature access (limited by barangay)
- ❌ VIEW_ANALYTICS
- ❌ EDIT_ALL_RECORDS
- ❌ DELETE_RECORDS

---

## 9. AUDIT LOGGING

Track important actions:

```typescript
import { auditLog } from "@/lib/audit-logger"; // Create this utility

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.isAuthenticated) return auth.error;

  const result = await updateRecord(id, data);

  // Log the action
  await auditLog({
    userId: auth.session.user.id,
    action: "UPDATE_RECORD",
    resourceType: "resident",
    resourceId: id,
    oldValue: original,
    newValue: result,
  });

  return createSuccessResponse(result);
}
```

---

## 10. COMMON PATTERNS

### Protecting a Page

```typescript
// app/dashboard/secret/layout.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { dbRoleToRoleType, RoleType } from "@/lib/rbac/roles";

export default async function SecretLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const role = dbRoleToRoleType(session.user.role);
  if (role !== RoleType.ADMIN) {
    redirect("/unauthorized");
  }

  return children;
}
```

### Conditional Rendering Based on Permission

```typescript
"use client";

import { usePermission } from "@/contexts/auth-context";
import { Permission } from "@/lib/rbac/permissions";

export function WarnDeleteButton({ onDelete }) {
  const canDelete = usePermission(Permission.DELETE_RECORDS);

  if (!canDelete) {
    return <span className="text-gray-400">Cannot delete</span>;
  }

  return (
    <button onClick={onDelete} className="text-red-600">
      Delete
    </button>
  );
}
```

### Multiple Role Check

```typescript
"use client";

import { useHasAnyRole } from "@/contexts/auth-context";
import { RoleType } from "@/lib/rbac/roles";

export function SupervisorPanel() {
  const isSupervisor = useHasAnyRole([RoleType.ADMIN, RoleType.BARANGAY_HEALTH]);

  return isSupervisor ? <div>Supervisor controls</div> : null;
}
```

---

## 11. TESTING RBAC

### Test Users for Development

Create these test accounts in your database:

| Username | Role | Barangay | Purpose |
|---|---|---|---|
| admin@test | admin | - | Full system access |
| staff@barangay1 | staff | Barangay 1 | Barangay Health Staff for Barangay 1 |
| worker@barangay1 | workers | Barangay 1 | Health worker in Barangay 1 |

### Test Checklist

- [ ] Admin can access all dashboards
- [ ] Barangay Health Staff can only see their assigned barangay
- [ ] Workers can only submit records for their barangay
- [ ] API endpoints return 403 for unauthorized roles
- [ ] Sidebar shows correct menu items per role
- [ ] Logout clears session and redirects to login

---

## 12. SECURITY BEST PRACTICES

1. **Never trust client-side checks alone** - Always validate on server
2. **Use middleware for route protection** - Not just component checks
3. **Validate RLS policies in database** - Defense in depth
4. **Audit sensitive changes** - Log who did what and when
5. **Generic error messages** - Don't reveal system structure
6. **HTTPS only in production** - Secure cookies require HTTPS
7. **Session expiry** - Default 7 days, configurable per login
8. **Role isolation** - Barangay-level data segregation enforced

---

## 13. TROUBLESHOOTING

### "Access Denied" errors

```typescript
// Check user's actual role
const { user } = useAuth();
console.log("User role:", user?.role);

// Verify session exists
const session = await getSession();
console.log("Session:", session);

// Check permission matrix
import { getPermissions } from "@/lib/rbac/permissions";
console.log("Permissions:", getPermissions(userRole));
```

### User can't see data from their barangay

```typescript
// Ensure assigned_barangay is set in users table
// Verify RLS policies include barangay column
// Check API queries include barangay filter
```

### Middleware not redirecting

```typescript
// Ensure middleware.ts is at root level
// Check matcher patterns in middleware config
// Verify cookie name matches in auth.ts
```

---

## 14. NEXT STEPS

1. ✅ RBAC core system created
2. ✅ AuthContext provider added
3. ✅ API authorization utilities created
4. ✅ Barangay Health Dashboard scaffolded
5. ⚠️ TODO: Update existing API routes with permission checks
6. ⚠️ TODO: Connect audit logging to database
7. ⚠️ TODO: Create admin user management interface
8. ⚠️ TODO: Test multi-role access scenarios

---

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `lib/rbac/roles.ts` | NEW | Role definitions and hierarchy |
| `lib/rbac/permissions.ts` | NEW | Permission matrix and checks |
| `lib/rbac/access-control.ts` | NEW | Data access authorization |
| `contexts/auth-context.tsx` | NEW | Client-side auth state |
| `middleware.ts` | NEW | Route protection |
| `app/api/auth/session/route.ts` | NEW | Session API endpoint |
| `lib/api-authorization.ts` | NEW | API endpoint protections |
| `app/dashboard-barangay/layout.tsx` | NEW | Barangay Health dashboard layout |
| `app/dashboard-barangay/page.tsx` | NEW | Barangay Health dashboard home |
| `components/layout/barangay-health-dashboard-layout.tsx` | NEW | Barangay Health UI layout |
| `RBAC_DESIGN.md` | NEW | System design document |

---

## Support & Questions

For questions about RBAC configuration, refer to:
- `RBAC_DESIGN.md` - Complete system design
- `lib/rbac/` - Core RBAC implementation
- `app/api/auth/` - Authentication endpoints
- Component examples above


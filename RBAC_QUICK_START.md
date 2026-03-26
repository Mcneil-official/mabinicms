# RBAC Quick Start Checklist

## For Developers Integrating RBAC

---

## ✅ Phase 1: Setup (First Time Only)

### 1. Add AuthProvider to Root Layout

**File: `app/layout.tsx` or `app/(root)/layout.tsx`**

```typescript
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Create Audit Logs Table (One-time Database Setup)

**Run in Supabase SQL Editor:**

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
  ));
```

---

## ✅ Phase 2: Protect Existing Routes

### Protected Page Layout Template

Replace existing session checks in dashboard layouts:

**Before:**
```typescript
export default async function Layout({ children }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return <SomeLayout>{children}</SomeLayout>;
}
```

**After:**
```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { dbRoleToRoleType, RoleType } from "@/lib/rbac/roles";

export default async function Layout({ children }) {
  const session = await getSession();
  
  if (!session) redirect("/auth/login");
  
  // Optional: Restrict to specific role
  const role = dbRoleToRoleType(session.user.role);
  if (role !== RoleType.ADMIN) {
    redirect("/auth/login");
  }
  
  return <SomeLayout user={session.user}>{children}</SomeLayout>;
}
```

### Protected API Route Template

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Process...
  return NextResponse.json(data);
}
```

**After:**
```typescript
import { requireAuth, createSuccessResponse } from "@/lib/api-authorization";
import { auditLog } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.isAuthenticated) return auth.error;
  
  // Log access
  await auditLog({
    userId: auth.session.user.id,
    action: "VIEW_DATA",
    resourceType: "residents",
    status: "success",
  });
  
  // Process...
  return createSuccessResponse(data);
}
```

---

## ✅ Phase 3: Add Role Checks to Components

### Add Permission Checks

**Before:**
```typescript
export function DeleteButton({ recordId }) {
  return <button onClick={() => deleteRecord(recordId)}>Delete</button>;
}
```

**After:**
```typescript
"use client";

import { usePermission, RequirePermission } from "@/contexts/auth-context";
import { Permission } from "@/lib/rbac/permissions";

export function DeleteButton({ recordId }) {
  const canDelete = usePermission(Permission.DELETE_RECORDS);
  
  if (!canDelete) {
    return <span className="text-gray-400 cursor-not-allowed">Delete</span>;
  }
  
  return (
    <button onClick={() => deleteRecord(recordId)}>
      Delete
    </button>
  );
}

// Or using guard component:
export function DeleteButtonGuard({ recordId }) {
  return (
    <RequirePermission permission={Permission.DELETE_RECORDS}>
      <button onClick={() => deleteRecord(recordId)}>Delete</button>
    </RequirePermission>
  );
}
```

### Add Role Checks to Navigation

**Before:**
```typescript
const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Staff", href: "/dashboard/staff" },
  { label: "Analytics", href: "/dashboard/analytics" },
];
```

**After:**
```typescript
"use client";

import { usePermission } from "@/contexts/auth-context";
import { Permission } from "@/lib/rbac/permissions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", show: true },
  { label: "Staff", href: "/dashboard/staff", permission: Permission.MANAGE_USERS },
  { label: "Analytics", href: "/dashboard/analytics", permission: Permission.VIEW_ANALYTICS },
];

export function Navigation() {
  return (
    <nav>
      {navigation
        .filter((item) => !item.permission || usePermission(item.permission))
        .map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
    </nav>
  );
}
```

---

## ✅ Phase 4: Data Access Control

### Protect Record Operations

**Before:**
```typescript
export async function updateResident(id: string, data: any) {
  const { data: resident, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  
  // Update...
}
```

**After:**
```typescript
import { canEditResource, UserContext } from "@/lib/rbac/access-control";

export async function updateResident(
  id: string,
  data: any,
  userContext: UserContext
) {
  const resident = await getResident(id);
  
  // Check permission
  if (!canEditResource(userContext, {
    barangay: resident.barangay,
    ownerId: resident.created_by,
  })) {
    throw new Error("Access denied");
  }
  
  // Update...
}
```

---

## ✅ Phase 5: Monitoring & Logging

### Add Action Logging to Key Operations

**Example: Delete Record**

```typescript
import { auditLog } from "@/lib/audit-logger";

export async function deleteResident(id: string, userId: string) {
  const old = await getResident(id);
  
  try {
    await supabase.from("residents").delete().eq("id", id);
    
    // Log success
    await auditLog({
      userId,
      action: "DELETE_RESIDENT",
      resourceType: "residents",
      resourceId: id,
      oldValue: old,
      status: "success",
    });
  } catch (error) {
    // Log failure
    await auditLog({
      userId,
      action: "DELETE_RESIDENT",
      resourceType: "residents",
      resourceId: id,
      status: "failed",
      details: error.message,
    });
    throw error;
  }
}
```

### Monitor Access in Components

```typescript
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AdminPanel() {
  const auth = useAuth();
  
  useEffect(() => {
    // Log that user viewed admin panel
    if (auth.user?.id) {
      fetch("/api/audit/log", {
        method: "POST",
        body: JSON.stringify({
          action: "VIEW_ADMIN_PANEL",
          resourceType: "page",
        }),
      });
    }
  }, [auth.user?.id]);
  
  return <div>Admin content</div>;
}
```

---

## ✅ Phase 6: Testing

### Test Each Role

**Admin User**
```
1. Log in → Should see /dashboard
2. Access /dashboard/staff → Should work
3. Call DELETE /api/residents/123 → Should work
```

**CHO User**
```
1. Log in → Should see /dashboard-barangay
2. Access /dashboard-barangay/health-workers → Should work
3. View residents → Should see own barangay only
4. Call DELETE /api/residents/123 → Should return 403
```

**Health Worker User**
```
1. Log in → Should see /dashboard-workers
2. Access /dashboard → Should redirect to login
3. Create record → Should work
4. Edit other worker's record → Should return 403
```

### Check Permission Matrix

```typescript
import { getPermissions } from "@/lib/rbac/permissions";
import { RoleType } from "@/lib/rbac/roles";

console.log("Admin permissions:", getPermissions(RoleType.ADMIN).length); // Should be 25+
console.log("CHO permissions:", getPermissions(RoleType.BARANGAY_HEALTH).length); // Should be 19
console.log("Worker permissions:", getPermissions(RoleType.WORK_HEALTH).length); // Should be 10
```

### Test Error Handling

```typescript
// Try accessing forbidden endpoint
fetch("/api/admin/users", {
  headers: { Authorization: "worker-token" },
})
.then(r => r.json())
.then(data => console.log(data)); // Should be { error: "Forbidden" }
```

---

## ✅ Phase 7: Future Enhancements

### When Adding New Features

1. **Define Permission**
   ```typescript
   // In lib/rbac/permissions.ts
   export enum Permission {
     // ... existing ...
     NEW_FEATURE_ACCESS = "new_feature_access",
   }
   ```

2. **Add to Appropriate Roles**
   ```typescript
   [RoleType.ADMIN]: new Set([
     // ... existing ...
     Permission.NEW_FEATURE_ACCESS,
   ]),
   ```

3. **Check in Component/API**
   ```typescript
   const canAccess = usePermission(Permission.NEW_FEATURE_ACCESS);
   ```

---

## Trouble Shooting

| Issue | Solution |
|-------|----------|
| User can't access page | Check role in database (admin/barangay_admin/workers) |
| Permission not working | Verify permission added to role's Set in permissions.ts |
| API returns 403 | Check session cookie exists, verify requireAuth() is called |
| Audit logs not appearing | Verify audit_logs table created, check auditLog() call |
| "Cannot access dashboard" | Ensure user.assigned_barangay is set in database |

---

## Command Reference

### Useful Queries

**Check user roles in database:**
```sql
SELECT id, username, user_role, assigned_barangay FROM public.users;
```

**View recent audit logs:**
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
```

**Get failed access attempts:**
```sql
SELECT * FROM audit_logs WHERE status = 'failed' ORDER BY created_at DESC;
```

---

## Summary Checklist

- [ ] AuthProvider added to root layout
- [ ] Audit logs table created in database
- [ ] Dashboard layouts updated with role checks
- [ ] API routes updated with requireAuth/requireRole
- [ ] Components use usePermission() for UI controls
- [ ] Navigation menus filter by permission
- [ ] Data access checks in place
- [ ] Action logging added to key operations
- [ ] All 3 roles tested end-to-end
- [ ] Audit logs verified for key actions
- [ ] Team documented & trained
- [ ] Deployed to production with HTTPS

---

**Status: Ready for Implementation** ✅


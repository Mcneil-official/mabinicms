# RBAC System - Architecture Diagrams

## 1. System Overview Flow

```
┌─────────────────┐
│   User Login    │
│   (username +   │
│   password)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Authentication Service             │
│  (lib/actions/auth.ts)              │
│  ✓ Hash password match              │
│  ✓ Retrieve user_role               │
│  ✓ Create 7-day session cookie      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Role-Specific Dashboard Routing    │
│  admin → /dashboard                 │
│  barangay_admin → /dashboard-barangay
│  workers → /dashboard-workers       │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  AuthProvider (React Context)            │
│  LoadSession → Parse Cookie → Store User│
│  Provides: useAuth(), usePermission()    │
│             useRole(), RequireRole()     │
└────────┬─────────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
Component   API Route
│           │
├─→ useAuth()     ├─→ requireAuth()
├─→ usePermission ├─→ requirePermission()
├─→ RequireRole   ├─→ requireBarangayScope()
└─→ Show/Hide UI  └─→ Accept/Deny Request
```

## 2. Permission Checking Flow

```
┌──────────────────┐
│  User Action     │
│  (click button)  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ usePermission(Permission.X)│
│ from auth-context.tsx      │
└────────┬───────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ hasPermission(role, permission)      │
│ from lib/rbac/permissions.ts         │
│                                      │
│ Checks PERMISSION_MATRIX[role]       │
│ for requested permission             │
└────────┬─────────────────────────────┘
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    ▼          ▼
  ✅         ❌
Show UI    Hide UI
Enable     Disable
 Action     Action
```

## 3. API Authorization Flow

```
┌─────────────────┐
│  API Request    │
│  POST /api/data │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│ await requireAuth(request)   │
│                              │
│ Check session cookie         │
│ Parse user info              │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
  EXISTS     MISSING
    │          │
    ▼          ▼
   ✅          ❌
CONTINUE   Return 401
           Unauthorized
    │
    ▼
┌────────────────────────────────┐
│ await requirePermission        │
│ (request, Permission.X)        │
│                                │
│ Check permission matrix        │
└────────┬───────────────────────┘
         │
    ┌────┴────┐
    │          │
  ALLOWED    DENIED
    │          │
    ▼          ▼
   ✅          ❌
CONTINUE   Return 403
           Forbidden
    │
    ▼
┌────────────────────────────────┐
│ Process Request                │
│ Log action to audit_logs       │
│ Return response                │
└────────────────────────────────┘
```

## 4. Role-Based Data Access

```
         User Requests Data
         │
         ▼
    ┌─────────────┐
    │  Check Role │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │             │
   ADMIN     NOT ADMIN
    │             │
    ▼             ▼
   ✓           NEED
  All         BARANGAY
 Data        SCOPE?
             │
        ┌────┴────┐
        │          │
      YES         NO
        │          │
        ▼          ▼
     Load       Restrict
   Data for   to NULL
   Barangay  (No Access)
        │
        ▼
    Return
    Filtered
     Data

Example Query:
WHERE 
  (user_role = 'admin')                    // Admin = all data
  OR (user_role = 'barangay_admin' AND 
      barangay = 'user_assigned_barangay') // CHO = own barangay
  OR (user_role = 'workers' AND 
      barangay = 'user_assigned_barangay') // Worker = own barangay
```

## 5. File Dependencies

```
┌──────────────────────────────────────────┐
│  Root Layout with AuthProvider           │
│  app/layout.tsx                          │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Auth Context Provider                   │
│  contexts/auth-context.tsx               │
└────────────┬─────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
RBAC Core        API Authorization
├─ roles.ts      ├─ api-authorization.ts
├─ permissions.ts├─ audit-logger.ts
└─ access-control├─ session/route.ts
                 └─ audit_logs table

                 │
                 ▼
           Dashboards & Pages
           ├─ /dashboard (Admin)
           ├─ /dashboard-barangay (CHO)
           └─ /dashboard-workers (Worker)
                 │
                 ▼
           Components & API
           ├─ useAuth(), usePermission()
           ├─ RequireRole, RequirePermission
           └─ requireAuth(), requirePermission()
```

## 6. Permission Matrix Visualization

```
PERMISSION                      │ ADMIN │ BARANGAY │ WORKER
                                │       │  HEALTH  │
────────────────────────────────┼───────┼──────────┼────────
Dashboard Access                │       │          │
  • view_admin_dashboard         │  ✅  │    ❌   │  ❌
  • view_barangay_dashboard      │  ❌  │   ✅   │  ❌
  • view_worker_dashboard        │  ✅  │   ✅   │  ✅
  • view_analytics               │  ✅  │   ✅   │  ❌
────────────────────────────────┼───────┼──────────┼────────
Data Management                 │       │          │
  • create_records              │  ✅  │   ✅   │  ✅
  • edit_own_records            │  ✅  │   ✅   │  ✅
  • edit_all_records            │  ✅  │   ✅*  │  ❌
  • delete_records              │  ✅  │   ❌   │  ❌
  • export_data                 │  ✅  │   ✅   │  ❌
  • view_all_barangays          │  ✅  │   ❌   │  ❌
────────────────────────────────┼───────┼──────────┼────────
User Management                 │       │          │
  • manage_users                │  ✅  │   ❌   │  ❌
  • assign_roles                │  ✅  │   ❌   │  ❌
  • view_barangay_users         │  ✅  │   ✅   │  ❌
  • view_audit_logs             │  ✅  │   ✅   │  ❌
────────────────────────────────┼───────┼──────────┼────────
Feature Access                  │       │          │
  • access_yakap                │  ✅  │   ✅   │  ✅
  • access_vaccines             │  ✅  │   ✅   │  ✅
  • access_maternal_health      │  ✅  │   ✅   │  ✅
  • access_barangay_profiling   │  ✅  │   ✅   │  ✅
  • access_facilities           │  ✅  │   ✅   │  ❌
  • access_announcements        │  ✅  │   ✅   │  ✅
────────────────────────────────┼───────┼──────────┼────────

* = Own barangay only
❌ = Not permitted
✅ = Permitted
```

## 7. Data Isolation by Role

```
┌─────────────────────────────────┐
│  Database (Supabase)            │
├─────────────────────────────────┤
│  residents                      │
│  ├─ id, name, barangay, ...     │
│  ├─ RLS Policy:                 │
│  │  user_role ='admin' → *      │
│  │  user_role = 'cho' AND       │
│  │    barangay = user_barangay  │
│  │  user_role = 'worker' AND    │
│  │    barangay = user_barangay  │
│  └─ user_created_by = user_id   │
└─────────────────────────────────┘
         │
         ├─→ Admin sees: [Barangay1, Barangay2, Barangay3, ...] ✅ All
         │
         ├─→ CHO (Barangay1) sees: [Barangay1] ✅ Own only
         │
         └─→ Worker (Barangay1) sees: [Barangay1] ✅ Own barangay records
             (limited to assigned cases)
```

## 8. Request Flow Example

```
User clicks "View Residents" in CHO Dashboard
         │
         ▼
┌────────────────────────────┐
│ GET /api/residents         │
│ Cookie: session=...        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Middleware checks cookie           │
│ Allows request to continue         │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ const scope = await                │
│ requireBarangayScope(request)       │
│ Returns: barangayScope = "Brgy1"   │
└────────┬───────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Query Supabase:                     │
│ SELECT * FROM residents             │
│ WHERE barangay = 'Brgy1'            │
│ (RLS policy enforces this)          │
└────────┬────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Log action:                        │
│ auditLog({                         │
│   userId: "user-123",              │
│   action: "VIEW_RESIDENTS",        │
│   resourceType: "residents",       │
│   status: "success"                │
│ })                                 │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Return JSON to frontend          │
│ [{ id: 1, name: "...", ...}, ...] │
└──────────────────────────────────┘
         │
         ▼
Frontend renders resident list
for Barangay 1 only ✅
```

## 9. Error Handling Flow

```
      Invalid Request
         │
    ┌────┴────┬────────┬──────────┐
    │         │        │          │
   NO      WRONG    NO         NO
  SESSION  ROLE     PERMISSION  DATA
  EXISTS   FOR      FOR         ACCESS
          PAGE      ACTION
    │      │        │          │
    ▼      ▼        ▼          ▼
  401    302      403        403
Unauth  Redirect Forbidden  Forbidden
  │      │        │          │
  ▼      ▼        ▼          ▼
Return  Take user Hide UI / API
Err     to login  Returns error
```

---

## Matrix Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed / Permitted |
| ❌ | Not Allowed / Denied |
| * | Conditional (with notes) |
| → | Flow direction |
| ▼ | Process step |

---

**Diagrams Last Updated**: 2026-03-21
**RBAC Version**: 1.0


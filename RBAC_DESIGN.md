# RBAC System Design - NagaCMS

## Overview
This document outlines the comprehensive Role-Based Access Control (RBAC) system for NagaCMS supporting three distinct user roles: Work Health, Barangay Health, and Admin.

---

## 1. ROLE DEFINITIONS

### Role Mapping
| Role ID | User Type | Database Role | Key Responsibilities |
|---------|-----------|---------------|----------------------|
| `WORK_HEALTH` | Health Workers | `workers` | Service delivery, record submission, vaccination tracking |
| `BARANGAY_HEALTH` | CHO/Health Officers | `barangay_admin` | Oversee workers, approve submissions, monitor indicators |
| `ADMIN` | System Admin | `admin` | System configuration, user management, data audits |

### Role Hierarchy
```
ADMIN (Super User)
  ├─ All permissions
  └─ Full system access
  
BARANGAY_HEALTH (Barangay-scoped)
  ├─ View/manage own barangay data
  ├─ Oversee health workers
  ├─ Monitor health indicators
  └─ Cannot access other barangay data
  
WORK_HEALTH (Field Workers)
  ├─ View assigned cases
  ├─ Submit service records
  ├─ Limited dashboard access
  └─ Cannot access admin features
```

---

## 2. PERMISSION MATRIX

### Dashboard Access
| Feature | Admin | Barangay Health | Work Health |
|---------|-------|-----------------|-------------|
| Admin Dashboard | ✅ | ❌ | ❌ |
| Barangay Health Dashboard | ❌ | ✅ | ❌ |
| Work Health Dashboard | ❌ | ✅ (view-only) | ✅ |
| Analytics | ✅ | ✅ | ❌ |
| Reporting | ✅ | ✅ | ❌ |

### Data Management
| Operation | Admin | Barangay Health | Work Health |
|-----------|-------|-----------------|-------------|
| Create Records | ✅ | ✅ | ✅ |
| Edit Own Records | ✅ | ✅ | ✅ |
| Edit Any Records | ✅ | ✅ (own barangay) | ❌ |
| Delete Records | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ |
| View All Barangays | ✅ | ❌ | ❌ |

### User Management
| Action | Admin | Barangay Health | Work Health |
|--------|-------|-----------------|-------------|
| Create Users | ✅ | ❌ | ❌ |
| Edit Users | ✅ | ✅ (own barangay) | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ |
| View User Logs | ✅ | ✅ (own barangay) | ❌ |

---

## 3. ROUTE PROTECTION STRATEGY

### Public Routes
- `/auth/login` - Role selector
- `/auth/workers` - (deprecated - route to main login)
- `/auth/logout`

### Protected Routes

#### Admin Only
- `/dashboard/admin/*` - Admin console
- `/api/admin/*` - Admin APIs
- `/dashboard/staff-management` - User management
- `/dashboard/system-settings` - System config

#### Barangay Health Only
- `/dashboard-barangay/*.tsx` - Barangay Health dashboard
- `/api/barangay-health/*` - Barangay Health APIs

#### Work Health Only
- `/dashboard-workers/*` - Worker dashboard (existing)
- `/api/health-workers/*` - Worker APIs

#### Multi-Role (Role-based filtering)
- `/dashboard/barangay-profiling` - Admin/Barangay Health (CHO can see all; workers see assigned)
- `/dashboard/health-indicators` - Admin/Barangay Health
- `/dashboard/announcements` - All authenticated (role-based visibility)

---

## 4. DATA ISOLATION STRATEGY

### Barangay-Level Isolation
```sql
-- Check for Barangay Health role accessing own barangay
WHERE
  (current_user_role = 'admin') 
  OR (current_user_role = 'barangay_admin' AND resident_barangay = current_assigned_barangay)
  OR (current_user_role = 'workers' AND resident_barangay = current_assigned_barangay)
```

### Work Health (Workers) Isolation
- View only: Records they created + records assigned to them
- Create: New records in their assigned barangay
- Cannot: See other barangay data, delete records

---

## 5. AUTHENTICATION FLOW

### Login Flow
```
1. User visits /auth/login
2. System checks for existing session
   → If exists: Redirect to role-specific dashboard
   → If not: Show login form
3. User enters credentials (username + password)
4. System:
   - Validates against public.users table
   - Verifies bcrypt password
   - Creates session with user_role + assigned_barangay
   - Sets httpOnly cookie (7-day expiry)
5. Redirect based on role:
   - admin → /dashboard (Admin Dashboard)
   - barangay_admin → /dashboard-barangay (Barangay Health Dashboard)
   - workers → /dashboard-workers (Work Health Dashboard)
```

### Session Structure
```typescript
{
  user: {
    id: string;
    username: string;
    role: "admin" | "barangay_admin" | "workers";
    assigned_barangay: string;
  };
  expires: string; // ISO date (7 days from login)
}
```

---

## 6. API SECURITY

### Authorization Headers Pattern
```typescript
// In each API route
const session = await getSession();

// 1. Check authentication
if (!session) return unauthorized();

// 2. Check role permission
const permission = checkPermission(session.user.role, action);
if (!permission) return forbidden();

// 3. Check data scope
if (!canAccessData(session.user, requestData)) return forbidden();
```

### CORS & API Rate Limiting
- API routes use authenticated Supabase client
- RLS policies enforce database-level security
- No additional CORS headers needed (same-origin)

---

## 7. IMPLEMENTATION FILES

### New Core RBAC Files
1. `lib/rbac/roles.ts` - Role definitions and hierarchies
2. `lib/rbac/permissions.ts` - Permission matrix and checking functions
3. `lib/rbac/access-control.ts` - Authorization utilities
4. `contexts/auth-context.tsx` - Client-side auth state + role methods
5. `middleware.ts` (updated) - Role-based route protection
6. `app/dashboard-barangay/layout.tsx` - Barangay Health dashboard
7. `components/barangay-health-dashboard.tsx` - Barangay Health UI

### Updated Files
- `lib/auth.ts` - Add `authenticateWithRole()`, `validateRoleAccess()`
- `app/auth/login/page.tsx` - Update to use new auth context
- `components/layout/sidebar.tsx` - Role-based menu rendering

---

## 8. UI/UX CONSIDERATIONS

### Dashboard Layouts
- **Consistent Top Navigation**: Logo, user info, notifications, logout
- **Role-Specific Sidebars**: Different menu items per role
- **Breadcrumbs**: Navigation context
- **Role Badge**: Display current role + barangay (if applicable)

### Permission-Denied UX
- 403 error page with helpful message
- "Contact your administrator" link
- Audit trail entry for attempted unauthorized access

### Feature Flags
- Menu items hidden if user lacks permission (not disabled)
- API calls fail gracefully with user-friendly error messages
- Buttons disabled on forms where user lacks update permission

---

## 9. AUDIT & LOGGING

### Track These Actions
1. Login/Logout
2. Data modifications (create, update, delete)
3. Permission denied attempts
4. Role changes
5. Barangay reassignments

### Log Table Structure
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. SECURITY BEST PRACTICES

1. **Principle of Least Privilege**: Users get minimum permissions needed
2. **Defense in Depth**:
   - Frontend route guards (UX)
   - Middleware authorization (request level)
   - API authorization (business logic)
   - RLS policies (database level)
3. **Session Security**: httpOnly cookies, CSRF protection via middleware
4. **Error Handling**: Generic error messages (don't reveal system details)
5. **Audit Trail**: All permission-related changes logged

---

## 11. FUTURE ENHANCEMENTS

1. Multi-barangay assignment per user
2. Temporary permission escalation (with approval)
3. Role-based API token generation
4. Team/group permissions
5. Custom role creation
6. Permission caching for performance
7. Two-factor authentication (2FA)
8. IP-based access restrictions

---

## Deployment Checklist

- [ ] Create new RBAC utility files
- [ ] Update middleware with role-based route guards
- [ ] Create auth context provider
- [ ] Implement Barangay Health dashboard
- [ ] Update API routes with permission checks
- [ ] Create login role selector UI
- [ ] Test all role-based access paths
- [ ] Create audit logs table
- [ ] Document admin onboarding procedures
- [ ] Train staff on role assignments
- [ ] Monitor audit logs post-deployment


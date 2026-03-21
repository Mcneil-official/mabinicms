/**
 * Authentication Context Provider
 * Provides user session and authorization utilities to the app
 */

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { RoleType, dbRoleToRoleType, isValidRole } from "@/lib/rbac/roles";
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, canAccessDashboard, canEditRecord, canDeleteRecords } from "@/lib/rbac/permissions";

export interface AuthUser {
  id: string;
  username: string;
  role: RoleType;
  assignedBarangay?: string;
}

export interface AuthContextType {
  // Session state
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role checking
  role: RoleType | null;
  hasRole: (role: RoleType) => boolean;
  hasRoles: (roles: RoleType[]) => boolean;

  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Feature access
  canAccessDashboard: (dashboardType: "admin" | "barangay" | "worker") => boolean;
  canEditRecord: (isOwnRecord: boolean) => boolean;
  canDeleteRecords: () => boolean;

  // Utility methods
  logout: () => Promise<void>;
  getBarangay: () => string | undefined;
  getUserDisplay: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Context Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from API on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Convert db role to RoleType
            const roleType = dbRoleToRoleType(data.user.role || data.user.user_role);
            if (roleType && isValidRole(roleType)) {
              setUser({
                id: data.user.id,
                username: data.user.username,
                role: roleType,
                assignedBarangay: data.user.assigned_barangay,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      window.location.href = "/auth/login";
    }
  };

  const getBarangay = () => user?.assignedBarangay;

  const getUserDisplay = () => {
    if (!user) return "";
    return `${user.username}${user.assignedBarangay ? ` (${user.assignedBarangay})` : ""}`;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role || null,

    // Role checking
    hasRole: (role: RoleType) => user?.role === role,
    hasRoles: (roles: RoleType[]) => user ? roles.includes(user.role) : false,

    // Permission checking
    hasPermission: (permission: Permission) => user ? hasPermission(user.role, permission) : false,
    hasAnyPermission: (permissions: Permission[]) =>
      user ? hasAnyPermission(user.role, permissions) : false,
    hasAllPermissions: (permissions: Permission[]) =>
      user ? hasAllPermissions(user.role, permissions) : false,

    // Feature access
    canAccessDashboard: (dashboardType: "admin" | "barangay" | "worker") =>
      user ? canAccessDashboard(user.role, dashboardType) : false,
    canEditRecord: (isOwnRecord: boolean) => user ? canEditRecord(user.role, isOwnRecord) : false,
    canDeleteRecords: () => user ? canDeleteRecords(user.role) : false,

    // Utility methods
    logout,
    getBarangay,
    getUserDisplay,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user has a specific role
 */
export function useRole(role: RoleType): boolean {
  const auth = useAuth();
  return auth.hasRole(role);
}

/**
 * Hook to check if user has any of the given roles
 */
export function useHasAnyRole(roles: RoleType[]): boolean {
  const auth = useAuth();
  return auth.hasRoles(roles);
}

/**
 * Hook to check if user has permission
 */
export function usePermission(permission: Permission): boolean {
  const auth = useAuth();
  return auth.hasPermission(permission);
}

/**
 * Hook to check if user has any of the given permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const auth = useAuth();
  return auth.hasAnyPermission(permissions);
}

/**
 * Component to require a specific role
 * Shows nothing if user doesn't have the role
 */
export function RequireRole({ role, children }: { role: RoleType; children: ReactNode }) {
  const hasRole = useRole(role);
  return hasRole ? children : null;
}

/**
 * Component to require any of the given roles
 */
export function RequireAnyRole({ roles, children }: { roles: RoleType[]; children: ReactNode }) {
  const hasRole = useHasAnyRole(roles);
  return hasRole ? children : null;
}

/**
 * Component to require a permission
 */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const hasPermission = usePermission(permission);
  return hasPermission ? children : null;
}

/**
 * Component to require any of the given permissions
 */
export function RequireAnyPermission({
  permissions,
  children,
}: {
  permissions: Permission[];
  children: ReactNode;
}) {
  const hasPermission = useHasAnyPermission(permissions);
  return hasPermission ? children : null;
}

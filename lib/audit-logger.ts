/**
 * Audit Logging Utilities
 * Tracks user actions for security and compliance
 */

import { createServerSupabaseClient } from "@/lib/auth";

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failed";
  details?: string;
  timestamp?: string;
}

/**
 * Log an audit event
 */
export async function auditLog(entry: AuditLog): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();

    // Ensure audit_logs table exists
    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      old_value: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      new_value: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      status: entry.status,
      details: entry.details || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging failures shouldn't break the app
  }
}

/**
 * Log authentication events
 */
export async function auditAuthEvent(userId: string, action: "login" | "logout" | "failed_login", details?: string) {
  await auditLog({
    userId,
    action: action.toUpperCase(),
    resourceType: "auth",
    status: action === "failed_login" ? "failed" : "success",
    details,
  });
}

/**
 * Log record operations
 */
export async function auditRecordOperation(
  userId: string,
  operation: "create" | "update" | "delete",
  resourceType: string,
  resourceId: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  await auditLog({
    userId,
    action: `${operation.toUpperCase()}_${resourceType.toUpperCase()}`,
    resourceType,
    resourceId,
    oldValue,
    newValue,
    status: "success",
  });
}

/**
 * Log permission-denied attempts
 */
export async function auditAccessDenied(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  reason?: string
) {
  await auditLog({
    userId,
    action: `DENIED_${action.toUpperCase()}`,
    resourceType,
    resourceId,
    status: "failed",
    details: reason,
  });
}

/**
 * Query audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error querying audit logs:", error);
    return [];
  }
}

/**
 * Query audit logs for a resource
 */
export async function getResourceAuditLogs(resourceType: string, resourceId?: string): Promise<AuditLog[]> {
  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("resource_type", resourceType);

    if (resourceId) {
      query = query.eq("resource_id", resourceId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error querying audit logs:", error);
    return [];
  }
}

/**
 * Query all failed access attempts
 */
export async function getFailedAccessAttempts(sinceHours: number = 24): Promise<AuditLog[]> {
  try {
    const supabase = createServerSupabaseClient();

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("status", "failed")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch failed attempts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error querying failed attempts:", error);
    return [];
  }
}

/**
 * Get audit summary for a barangay
 */
export async function getBarangayAuditSummary(barangay: string, days: number = 7) {
  try {
    const supabase = createServerSupabaseClient();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("audit_logs")
      .select("action, status, count()")
      .gte("created_at", since)
      .order("action");

    if (error) {
      console.error("Failed to fetch audit summary:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error querying audit summary:", error);
    return null;
  }
}

/**
 * Export audit logs to CSV (for compliance/audits)
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  const headers = ["Timestamp", "User ID", "Action", "Resource Type", "Resource ID", "Status", "Details"];
  const rows = logs.map((log) => [
    log.timestamp || "",
    log.userId,
    log.action,
    log.resourceType,
    log.resourceId || "",
    log.status,
    log.details || "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape CSV values
          const str = String(cell || "");
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  return csv;
}

/**
 * Create migration for audit_logs table (run once)
 * 
 * SQL to run in Supabase:
 * 
 * CREATE TABLE audit_logs (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES public.users(id),
 *   action VARCHAR(100) NOT NULL,
 *   resource_type VARCHAR(50) NOT NULL,
 *   resource_id UUID,
 *   old_value JSONB,
 *   new_value JSONB,
 *   ip_address INET,
 *   user_agent TEXT,
 *   status VARCHAR(20) NOT NULL DEFAULT 'success',
 *   details TEXT,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
 * CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
 * CREATE INDEX idx_audit_action ON audit_logs(action);
 * CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
 * 
 * ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY "users_can_view_own_audit_logs"
 *   ON audit_logs FOR SELECT
 *   USING (user_id = auth.uid() OR EXISTS (
 *     SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin'
 *   ));
 */

/**
 * Database schema migration helper
 */
export const AUDIT_LOGS_MIGRATION = `
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
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND user_role = 'admin'
    )
  );
`;

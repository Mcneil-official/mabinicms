"use client";

import { AuditLogsViewer } from "@/components/admin/audit-logs-viewer";

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-8">
      <AuditLogsViewer />
    </div>
  );
}

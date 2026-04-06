"use client";

import { AdminDashboardOverview } from "@/components/admin/dashboard-overview";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">System overview and management</p>
      </div>
      <AdminDashboardOverview />
    </div>
  );
}

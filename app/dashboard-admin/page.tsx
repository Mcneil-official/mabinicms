"use client";

import { AdminDashboardOverview } from "@/components/admin/dashboard-overview";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview, analytics, and management in one place
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Key system metrics and recent activity
          </p>
        </div>
        <AdminDashboardOverview />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Detailed charts and role distribution
          </p>
        </div>
        <AnalyticsDashboard />
      </section>
    </div>
  );
}

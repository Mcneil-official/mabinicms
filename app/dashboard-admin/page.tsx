"use client";

import Image from "next/image";
import { AdminDashboardOverview } from "@/components/admin/dashboard-overview";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-5 shadow-sm dark:border-blue-900/40 dark:bg-slate-950/70">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src="/mabini-logo.png"
            alt="MabiniCare official logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border border-blue-200 bg-white object-cover"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Municipal Health Platform
          </p>
        </div>
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

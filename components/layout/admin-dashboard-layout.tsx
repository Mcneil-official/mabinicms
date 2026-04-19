"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import type { User } from "@/lib/types";

interface AdminDashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function AdminDashboardLayout({
  user,
  children,
}: AdminDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 dark:from-slate-900 dark:to-slate-900">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col md:ml-64">
        <AdminHeader
          user={user}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}

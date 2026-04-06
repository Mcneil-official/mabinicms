"use client";

import { adminLogoutAction } from "@/lib/actions/admin-auth";
import { SidebarToggle } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User } from "@/lib/types";

interface AdminHeaderProps {
  user: User;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function AdminHeader({
  user,
  sidebarOpen,
  onSidebarToggle,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-slate-950">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarToggle isOpen={sidebarOpen} onToggle={onSidebarToggle} />
          <h1 className="hidden text-lg font-semibold text-rose-900 sm:block dark:text-rose-200">
            Admin Control Center
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user.username}
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await adminLogoutAction();
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

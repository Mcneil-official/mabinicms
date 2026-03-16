"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  Heart,
  MapPin,
  Users,
  TrendingUp,
  Menu,
  X,
  Calendar,
  Megaphone,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

interface SidebarProps {
  user: User;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  { href: "/dashboard/yakap", icon: FileCheck, label: "YAKAP Applications" },
  { href: "/dashboard/submissions", icon: Heart, label: "Submissions" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Appointments" },
  {
    href: "/dashboard/announcements",
    icon: Megaphone,
    label: "Announcements",
  },
  { href: "/dashboard/facilities", icon: MapPin, label: "Facilities" },
  {
    href: "/dashboard/health-indicators",
    icon: TrendingUp,
    label: "Health Indicators",
  },
  {
    href: "/dashboard/medications",
    icon: Pill,
    label: "Medications",
  },
  { href: "/dashboard/staff", icon: Users, label: "Staff Management" },
  {
    href: "/dashboard/barangay-profiling",
    icon: Megaphone,
    label: "Barangay Profiling",
  },
];

export function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isAdmin = user.role === "admin";
  const staffMenuItems = isAdmin
    ? menuItems
    : menuItems.filter((item) => item.href !== "/dashboard/staff");

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950",
        !isOpen && "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Health System
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {user.assigned_barangay}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {staffMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            SIGNED IN AS
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {user.username}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {user.role}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function SidebarToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden"
      aria-label="Toggle sidebar"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

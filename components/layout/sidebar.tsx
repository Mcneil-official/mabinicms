"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Megaphone,
  Pill,
  History,
  Settings,
  Bell,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

interface SidebarProps {
  user: User;
  isOpen?: boolean;
  onClose?: () => void;
}

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const staffSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        href: "/dashboard-barangay",
        icon: LayoutDashboard,
        label: "Dashboard",
        exact: true,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard-barangay/announcements", icon: Megaphone, label: "Announcements" },
      {
        href: "/dashboard-barangay/appointments-facilities",
        icon: Calendar,
        label: "Appointments & Facilities",
      },
    ],
  },
  {
    title: "Health Data",
    items: [
      { href: "/dashboard-barangay/medications", icon: Pill, label: "Medications" },
      {
        href: "/dashboard-barangay/barangay-profiling",
        icon: Users,
        label: "Barangay Profiling",
      },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        href: "/dashboard-admin",
        icon: LayoutDashboard,
        label: "Admin Overview",
        exact: true,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard-admin/users", icon: Users, label: "Users" },
      { href: "/dashboard-admin/worker-operations", icon: Activity, label: "Worker Operations" },
      { href: "/dashboard-admin/announcements", icon: Bell, label: "Announcements" },
    ],
  },
  {
    title: "Health Data",
    items: [
      { href: "/dashboard-admin/facilities", icon: MapPin, label: "Facilities" },
      { href: "/dashboard-admin/medications", icon: Pill, label: "Medications" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/dashboard-admin/audit-logs", icon: History, label: "Audit Logs" },
      { href: "/dashboard-admin/settings", icon: Settings, label: "System Settings" },
    ],
  },
];

export function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () =>
      staffSections.reduce((acc, section) => {
        acc[section.title] = true;
        return acc;
      }, {} as Record<string, boolean>),
  );

  const normalizedRole = (user.role || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const visibleSections = isAdmin ? adminSections : staffSections;

  const adminItems = adminSections.flatMap((section) => section.items);

  const toggleSection = (title: string) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

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
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-blue-200/80 bg-white transition-transform duration-200 dark:border-blue-900/40 dark:bg-slate-950",
        !isOpen && "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-blue-200/80 px-6 py-6 dark:border-blue-900/40">
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              MabiniCare
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {user.assigned_barangay}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {isAdmin ? (
            <div className="space-y-1">{adminItems.map(renderItem)}</div>
          ) : (
            visibleSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-expanded={openSections[section.title]}
                  aria-label={`Toggle ${section.title}`}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      openSections[section.title] ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "space-y-1 overflow-hidden transition-all duration-200",
                    openSections[section.title] ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {section.items.map(renderItem)}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* User Info */}
        <div className="border-t border-blue-200/80 px-6 py-4 dark:border-blue-900/40">
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

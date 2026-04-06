"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Users,
  FileText,
  Bell,
  Pill,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Stethoscope,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { workerLogoutAction } from "@/lib/actions/worker-auth";
import type { User as UserType } from "@/lib/types";

interface WorkerDashboardLayoutProps {
  children: React.ReactNode;
  user: UserType;
}

type NavItem = {
  name: string;
  href: string;
  icon: typeof Home;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard-workers",
        icon: Home,
      },
    ],
  },
  {
    title: "Field Operations",
    items: [
      {
        name: "Data Entry",
        href: "/dashboard-workers/data-entry",
        icon: Stethoscope,
      },
      {
        name: "Residents",
        href: "/dashboard-workers/residents",
        icon: Users,
      },
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        name: "Reports",
        href: "/dashboard-workers/reports",
        icon: FileText,
      },
      {
        name: "Announcements",
        href: "/dashboard-workers/announcements",
        icon: Bell,
      },
      {
        name: "Medication Inventory",
        href: "/dashboard-workers/medications",
        icon: Pill,
      },
    ],
  },
];

export function WorkerDashboardLayout({
  children,
  user,
}: WorkerDashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDesktopSections, setOpenDesktopSections] = useState<Record<string, boolean>>(
    () =>
      navigation.reduce((acc, section) => {
        acc[section.title] = true;
        return acc;
      }, {} as Record<string, boolean>),
  );
  const [openMobileSections, setOpenMobileSections] = useState<Record<string, boolean>>(
    () =>
      navigation.reduce((acc, section) => {
        acc[section.title] = true;
        return acc;
      }, {} as Record<string, boolean>),
  );

  const handleLogout = async () => {
    await workerLogoutAction();
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const toggleDesktopSection = (title: string) => {
    setOpenDesktopSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const toggleMobileSection = (title: string) => {
    setOpenMobileSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-emerald-200 bg-white dark:border-emerald-800 dark:bg-slate-950 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-emerald-200 px-6 dark:border-emerald-800">
            <Users className="h-6 w-6 text-emerald-600" />
            <span className="ml-2 text-lg font-bold text-emerald-900 dark:text-emerald-100">
              Worker Portal
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-5 p-4">
            {navigation.map((section) => (
              <div key={section.title} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleDesktopSection(section.title)}
                  className="flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-expanded={openDesktopSections[section.title]}
                  aria-label={`Toggle ${section.title}`}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      openDesktopSections[section.title] ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "space-y-1 overflow-hidden transition-all duration-200",
                    openDesktopSections[section.title] ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Worker Info */}
          <div className="border-t border-emerald-200 p-4 dark:border-emerald-800">
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950">
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                Logged in as Worker
              </p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                {user.username}
              </p>
              {user.assigned_barangay && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  {user.assigned_barangay}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white lg:hidden">
              Worker Portal
            </h2>
          </div>

          {/* QR Scanner quick-access button */}
          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Link href="/dashboard-workers/scanner">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-emerald-300">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {getUserInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-slate-500">
                    Role:{" "}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-emerald-200 bg-white dark:border-emerald-800 dark:bg-slate-950">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center justify-between border-b border-emerald-200 px-6 dark:border-emerald-800">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                  <span className="ml-2 text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    Worker Portal
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-5 p-4">
                {navigation.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleMobileSection(section.title)}
                      className="flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      aria-expanded={openMobileSections[section.title]}
                      aria-label={`Toggle ${section.title}`}
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          openMobileSections[section.title] ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "space-y-1 overflow-hidden transition-all duration-200",
                        openMobileSections[section.title] ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                              ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                              }
                            `}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Worker Info */}
              <div className="border-t border-emerald-200 p-4 dark:border-emerald-800">
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950">
                  <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                    Logged in as Worker
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {user.username}
                  </p>
                  {user.assigned_barangay && (
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                      {user.assigned_barangay}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

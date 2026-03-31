/**
 * Barangay Health Dashboard Layout Component
 * Main UI container for Barangay Health Officers
 */

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
  Heart,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface BarangayHealthDashboardLayoutProps {
  children: React.ReactNode;
  user: UserType;
}

const mainNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard-barangay",
    icon: Home,
  },
  {
    name: "Health Workers",
    href: "/dashboard-barangay/health-workers",
    icon: Users,
  },
  {
    name: "Residents",
    href: "/dashboard-barangay/residents",
    icon: Users,
  },
  {
    name: "Pregnancy Monitoring",
    href: "/dashboard-barangay/pregnancy-monitoring",
    icon: Heart,
  },
  {
    name: "Analytics",
    href: "/dashboard-barangay/analytics",
    icon: BarChart3,
  },
  {
    name: "Reports",
    href: "/dashboard-barangay/reports",
    icon: FileText,
  },
];

const adminNavigation = [
  {
    name: "Staff Management",
    href: "/dashboard-barangay/staff",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/dashboard-barangay/settings",
    icon: Settings,
  },
];

export function BarangayHealthDashboardLayout({
  children,
  user,
}: BarangayHealthDashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavLink = ({
    href,
    icon: Icon,
    name,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    name: string;
  }) => (
    <Link
      href={href}
      className={`
        flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${
          isActive(href)
            ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {name}
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-blue-200 bg-white dark:border-blue-800 dark:bg-slate-950 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-blue-200 px-6 dark:border-blue-800">
          <Heart className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-lg font-bold text-blue-900 dark:text-blue-100">
            CHO Portal
          </span>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Main</p>
          {mainNavigation.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} />
          ))}

          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

          <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Administration</p>
          {adminNavigation.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} />
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-blue-200 p-4 dark:border-blue-800">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Barangay Health Officer
            </p>
            <p className="mt-1 text-xs font-semibold text-blue-900 dark:text-blue-100">
              {user.username}
            </p>
            {user.assigned_barangay && (
              <p className="mt-1 flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                <span>📍</span>
                {user.assigned_barangay}
              </p>
            )}
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
              CHO Dashboard
            </h2>
          </div>

          {/* Header right side */}
          <div className="flex items-center gap-4">
            {/* Alert Bell */}
            <Button variant="ghost" size="icon" className="relative">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-blue-300">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.username}</span>
                    <span className="text-xs font-normal text-slate-500">
                      {user.assigned_barangay || "No barangay assigned"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard-barangay/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950 lg:hidden">
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} />
              ))}
              <div className="my-3 border-t border-slate-200 dark:border-slate-700" />
              {adminNavigation.map((item) => (
                <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} />
              ))}
            </div>
          </nav>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

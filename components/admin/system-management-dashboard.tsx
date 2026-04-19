"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseMedical,
  Building2,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  RefreshCw,
  Shield,
  Settings,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DashboardStats {
  users?: { total: number; active: number; inactive: number; byRole: Record<string, number> };
  residents?: { total: number; profiles: number };
  facilities?: { total: number; byBarangay: Record<string, number> };
  activity?: { logsLast24Hours: number; totalLogs: number };
  yakap?: { total: number; byStatus: Record<string, number> };
  appointments?: { total: number; byStatus: Record<string, number> };
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function getCoveragePercent(stats: DashboardStats | null): number {
  if (!stats?.residents?.total || stats.residents.total <= 0) return 0;
  const profiles = toNumber(stats.residents.profiles, 0);
  return Math.max(0, Math.min(100, Math.round((profiles / stats.residents.total) * 100)));
}

export function SystemManagementDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/analytics?type=overview");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin system metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metrics = useMemo(() => {
    const totalResidents = toNumber(stats?.residents?.total, 0);
    const pregnancyCases = toNumber(stats?.yakap?.total, 0);
    const vaccinationCoverage = getCoveragePercent(stats);
    const criticalAlerts = vaccinationCoverage < 50 ? 1 : 0;

    return {
      totalResidents,
      pregnancyCases,
      vaccinationCoverage,
      criticalAlerts,
      lastPulse: new Date().toLocaleString(),
    };
  }, [stats]);

  const managementCards = [
    {
      title: "User Access Control",
      description: "Manage system users, roles, and access permissions for all staff.",
      href: "/dashboard-admin/users",
      icon: Users,
    },
    {
      title: "Barangay Health Management",
      description: "Manage barangay health operations, workers, facilities, and vaccination coverage.",
      href: "/dashboard-admin/facilities",
      icon: Building2,
    },
    {
      title: "Worker Operations Management",
      description: "Manage worker assignments, field activities, and health worker workflows.",
      href: "/dashboard-admin/worker-operations",
      icon: Waves,
    },
    {
      title: "System Announcements",
      description: "Create and publish system-wide notices and health alerts.",
      href: "/dashboard-admin/announcements",
      icon: Bell,
    },
    {
      title: "Medication Inventory",
      description: "Manage medication stock, distribution, and barangay allocation.",
      href: "/dashboard-admin/medications",
      icon: BriefcaseMedical,
    },
    {
      title: "Reports & Submissions",
      description: "View health indicators, submissions, and comprehensive audit records.",
      href: "/dashboard-admin/audit-logs",
      icon: ClipboardList,
    },
    {
      title: "System Settings",
      description: "Configure persistent operational defaults and platform controls.",
      href: "/dashboard-admin/settings",
      icon: Settings,
    },
  ];

  const quickActions = [
    { label: "Manage Users", href: "/dashboard-admin/users", emphasis: true },
    { label: "Review Appointments", href: "/dashboard-admin/audit-logs" },
    { label: "Health Indicators", href: "/dashboard-admin/audit-logs" },
    { label: "Barangay Health Operations", href: "/dashboard-admin/facilities" },
    { label: "Worker Field Operations", href: "/dashboard-admin/worker-operations" },
    { label: "Medication Management", href: "/dashboard-admin/medications" },
    { label: "System Settings", href: "/dashboard-admin/settings" },
  ];

  const panelLinks = [
    {
      title: "Admin Dashboard",
      description: "View system overview and core statistics",
      href: "/dashboard-admin",
      icon: Shield,
      tone: "bg-emerald-50 border-emerald-100 text-emerald-900",
    },
    {
      title: "User Management",
      description: "Manage system users, roles, and access",
      href: "/dashboard-admin/users",
      icon: Users,
      tone: "bg-blue-50 border-blue-100 text-blue-900",
    },
    {
      title: "Barangay Operations",
      description: "Manage barangay health operations",
      href: "/dashboard-admin/facilities",
      icon: BadgeCheck,
      tone: "bg-violet-50 border-violet-100 text-violet-900",
    },
    {
      title: "Worker Operations",
      description: "Manage worker field activities",
      href: "/dashboard-admin/worker-operations",
      icon: HeartPulse,
      tone: "bg-amber-50 border-amber-100 text-amber-900",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-900 via-blue-950 to-slate-950 px-5 py-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              Admin Control Center
            </p>
            <h1 className="text-3xl font-bold tracking-tight">System Management Dashboard</h1>
            <p className="text-sm text-blue-100/90">
              Central hub for managing all system operations. Admin handles barangay health operations, worker field activities,
              user access, announcements, medications, and health reporting.
            </p>
          </div>

          <div className="space-y-2">
            <p className="flex items-center justify-end gap-2 text-xs text-blue-100/90">
              <RefreshCw className="h-3.5 w-3.5" />
              Last pulse update: {metrics.lastPulse}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-blue-200/40 bg-white/10 text-white hover:bg-white/20" type="button">
                Refresh System Pulse
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" className="bg-white text-blue-900 hover:bg-blue-100">
                    Admin Management
                  </Button>
                </DialogTrigger>
                <DialogContent
                  showCloseButton={false}
                  className="right-0 left-auto top-0 h-screen w-full max-w-[350px] translate-x-0 translate-y-0 rounded-none border-l border-slate-200 p-0 sm:max-w-[350px]"
                >
                  <DialogHeader className="border-b border-slate-200 px-5 py-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <DialogTitle className="text-2xl font-semibold text-slate-900">Admin Management</DialogTitle>
                        <DialogDescription className="mt-1">System-level control shortcuts</DialogDescription>
                      </div>
                      <DialogClose asChild>
                        <button
                          type="button"
                          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Close admin management panel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </DialogClose>
                    </div>
                  </DialogHeader>

                  <div className="space-y-3 px-5 py-4">
                    {panelLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={`group block rounded-2xl border p-4 transition hover:shadow-sm ${item.tone}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="flex items-center gap-2 text-xl font-semibold leading-none">
                                <Icon className="h-5 w-5" />
                                {item.title}
                              </p>
                              <p className="text-sm opacity-80">{item.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-90" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="px-5 pb-5">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full">
                        Close
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-0">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Total Residents</CardTitle>
            <p className="text-4xl font-bold text-slate-900">{loading ? "..." : metrics.totalResidents}</p>
          </CardHeader>
          <CardContent className="pt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">Live System Signal</CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Pregnancy Cases</CardTitle>
            <p className="text-4xl font-bold text-slate-900">{loading ? "..." : metrics.pregnancyCases}</p>
          </CardHeader>
          <CardContent className="pt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">Live System Signal</CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Vaccination Coverage</CardTitle>
            <p className="text-4xl font-bold text-slate-900">{loading ? "..." : `${metrics.vaccinationCoverage}%`}</p>
          </CardHeader>
          <CardContent className="pt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">Live System Signal</CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Critical Alerts</CardTitle>
            <p className="text-4xl font-bold text-slate-900">{loading ? "..." : metrics.criticalAlerts}</p>
          </CardHeader>
          <CardContent className="pt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">Live System Signal</CardContent>
        </Card>
      </section>

      <Card className="gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Priority Signals</CardTitle>
          <p className="text-sm text-muted-foreground">Insights generated from current system analytics.</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Low vaccination coverage detected</p>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-600">
                critical
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Coverage is {loading ? "..." : `${metrics.vaccinationCoverage}%`}. Prioritize immunization outreach this week.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {managementCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="gap-3">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-4 w-4 text-slate-500" />
                  {item.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Quick Access</CardTitle>
          <p className="text-sm text-muted-foreground">Direct entry points for common management tasks.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              asChild
              key={action.label}
              variant={action.emphasis ? "default" : "outline"}
              size="sm"
              className={action.emphasis ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Admin Mission Board</CardTitle>
          <p className="text-sm text-muted-foreground">High-impact actions to keep operations aligned today.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              Validate staffing and role assignments
            </p>
            <p className="mt-1 text-sm text-slate-600">Ensure users and permissions reflect current deployment needs.</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Review unresolved health signals
            </p>
            <p className="mt-1 text-sm text-slate-600">Audit pending alerts and route response tasks to the right teams.</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              Confirm today’s operations sequence
            </p>
            <p className="mt-1 text-sm text-slate-600">Align visits, medication flow, and field assignments before noon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

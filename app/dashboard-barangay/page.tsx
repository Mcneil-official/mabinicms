"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getYakakApplications } from "@/lib/queries/yakap";
import { format } from "date-fns";
import type { YakakApplication } from "@/lib/types";
import type { DashboardData as AnalyticsDashboardData } from "@/components/analytics/analytics-health-dashboard";

type DashboardAnalyticsResponse = {
  barangay?: string;
  generatedAt?: string;
  kpis?: {
    totalResidents?: number;
  };
  vaccinationStatus?: AnalyticsDashboardData["vaccinationStatus"];
  monthlyTrend?: AnalyticsDashboardData["monthlyTrend"];
  priorityServices?: AnalyticsDashboardData["priorityServices"];
  commonConditions?: AnalyticsDashboardData["commonConditions"];
  insights?: AnalyticsDashboardData["insights"];
};

const BarangayGisMapIntegrated = dynamic(
  () =>
    import("@/components/dashboard/barangay-gis-map-integrated").then(
      (mod) => mod.BarangayGisMapIntegrated,
    ),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Barangay Vaccination Coverage Map</CardTitle>
          <CardDescription>Loading map...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    ),
  },
);

const AnalyticsHealthDashboard = dynamic(
  () =>
    import("@/components/analytics/analytics-health-dashboard").then(
      (mod) => mod.AnalyticsHealthDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Health Indicators</CardTitle>
          <CardDescription>Loading analytics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] rounded-lg bg-gray-100 dark:bg-gray-900" />
        </CardContent>
      </Card>
    ),
  },
);

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCard) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const [recentApplications, setRecentApplications] = useState<
    YakakApplication[]
  >([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboardData | null>(null);
  const [stats, setStats] = useState({
    pending_submissions: 0,
    pending_yakap: 0,
    approved_yakap: 0,
    returned_submissions: 0,
    total_residents: 0,
    total_applications: 0,
  });

  // Fetch recent YAKAP applications
  const fetchRecentApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Admin users have a dedicated dashboard surface.
      if ((session.user.role || "").trim().toLowerCase() === "admin") {
        router.replace("/dashboard-admin");
        return;
      }

      const result = await getYakakApplications(session.user.assigned_barangay, false, {
        limit: 1000,
      });
      const allApplications = result.data || [];
      const recent = allApplications.slice(0, 10);
      setRecentApplications(recent);

      let totalResidents = 0;
      try {
        const analyticsResponse = await fetch("/api/dashboard-barangay/analytics", {
          cache: "no-store",
        });

        if (analyticsResponse.ok) {
          const analyticsData =
            (await analyticsResponse.json()) as DashboardAnalyticsResponse;
          totalResidents = Number(analyticsData?.kpis?.totalResidents || 0);

          if (analyticsData?.kpis) {
            setAnalyticsData({
              barangay: analyticsData.barangay || session.user.assigned_barangay || "",
              generatedAt: analyticsData.generatedAt || new Date().toISOString(),
              kpis: {
                totalResidents: Number(analyticsData.kpis.totalResidents || 0),
                pregnancyCases: 0,
                vaccinationCoverage: 0,
                criticalAlerts: 0,
              },
              vaccinationStatus: analyticsData.vaccinationStatus || [],
              monthlyTrend: analyticsData.monthlyTrend || [],
              priorityServices: analyticsData.priorityServices || [],
              commonConditions: analyticsData.commonConditions || [],
              insights: analyticsData.insights || [],
            });
          }
        }
      } catch (analyticsError) {
        console.error("[fetchDashboardAnalytics]", analyticsError);
      }

      setStats({
        pending_submissions: 0, // This would need a separate submissions table
        pending_yakap: allApplications.filter((app) => app.status === "pending")
          .length,
        approved_yakap: allApplications.filter(
          (app) => app.status === "approved",
        ).length,
        returned_submissions: allApplications.filter(
          (app) => app.status === "returned",
        ).length,
        total_residents: totalResidents,
        total_applications: allApplications.length,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("[fetchRecentApplications]", error);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRecentApplications();
  }, [fetchRecentApplications]);

  useEffect(() => {
    let cancelled = false;

    const revealDeferredSections = () => {
      if (!cancelled) {
        setShowDeferredSections(true);
      }
    };

    if (typeof window === "undefined") {
      return () => {
        cancelled = true;
      };
    }

    if ("requestIdleCallback" in window) {
      const idleWindow = window as Window & {
        requestIdleCallback: typeof window.requestIdleCallback;
        cancelIdleCallback: typeof window.cancelIdleCallback;
      };
      const idleId = idleWindow.requestIdleCallback(revealDeferredSections, {
        timeout: 1500,
      });

      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(revealDeferredSections, 300);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome back. Here's an overview of your health system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Pending Submissions"
          value={stats.pending_submissions}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50 dark:bg-amber-950"
        />
        <StatCard
          title="Pending YAKAP"
          value={stats.pending_yakap}
          icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
          color="bg-yellow-50 dark:bg-yellow-950"
        />
        <StatCard
          title="Approved YAKAP"
          value={stats.approved_yakap}
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          color="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          title="Returned Submissions"
          value={stats.returned_submissions}
          icon={<FileText className="h-6 w-6 text-red-600" />}
          color="bg-red-50 dark:bg-red-950"
        />
        <StatCard
          title="Total Residents"
          value={stats.total_residents}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          title="Total Applications"
          value={stats.total_applications}
          icon={<FileText className="h-6 w-6 text-indigo-600" />}
          color="bg-indigo-50 dark:bg-indigo-950"
        />
      </div>

      {showDeferredSections ? (
        <>
          {/* Barangay Vaccination Coverage GIS Map */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              Health Coverage by Barangay
            </h2>
            <BarangayGisMapIntegrated
              useFallbackData={true}
              mapHeight="h-[600px]"
              showLegend={true}
              showMapLegend={true}
            />
          </section>

          {/* Health Indicators merged into dashboard for staff */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              Health Indicators
            </h2>
            <AnalyticsHealthDashboard
              endpoint="/api/dashboard-barangay/analytics"
              initialData={analyticsData}
            />
          </section>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Health Coverage by Barangay</CardTitle>
              <CardDescription>
                Preparing the interactive coverage map...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] rounded-lg bg-slate-100 dark:bg-slate-900" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Health Indicators</CardTitle>
              <CardDescription>
                Preparing analytics and indicators...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] rounded-lg bg-slate-100 dark:bg-slate-900" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest YAKAP applications ({recentApplications.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading recent activity...</p>
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No recent YAKAP applications</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="font-semibold">
                      Resident Name
                    </TableHead>
                    <TableHead className="font-semibold">Barangay</TableHead>
                    <TableHead className="font-semibold">
                      Membership Type
                    </TableHead>
                    <TableHead className="font-semibold">
                      PhilHealth No.
                    </TableHead>
                    <TableHead className="font-semibold">
                      Applied Date
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApplications.map((app) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "pending":
                          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
                        case "approved":
                          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                        case "returned":
                          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
                        case "rejected":
                          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                        default:
                          return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
                      }
                    };

                    const getMembershipBadgeColor = (type: string) => {
                      switch (type) {
                        case "individual":
                          return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
                        case "family":
                          return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700";
                        case "senior":
                          return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
                        case "pwd":
                          return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700";
                        default:
                          return "bg-gray-50 text-gray-700 border-gray-200";
                      }
                    };

                    return (
                      <TableRow
                        key={app.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      >
                        <TableCell className="font-medium">
                          {app.resident_name}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {app.barangay}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize ${getMembershipBadgeColor(app.membership_type)}`}
                          >
                            {app.membership_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {app.philhealth_no || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(app.applied_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`capitalize ${getStatusColor(app.status)}`}
                          >
                            {app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

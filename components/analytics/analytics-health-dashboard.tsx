"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  HeartPulse,
  RefreshCcw,
  ShieldAlert,
  Syringe,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type InsightSeverity = "positive" | "warning" | "critical";

type Insight = {
  title: string;
  description: string;
  severity: InsightSeverity;
};

type CountItem = {
  name: string;
  value: number;
};

type TrendItem = {
  month: string;
  vaccinations: number;
  pregnancyVisits: number;
  priorityServices: number;
};

type DashboardData = {
  barangay: string;
  generatedAt: string;
  kpis: {
    totalResidents: number;
    pregnancyCases: number;
    vaccinationCoverage: number;
    criticalAlerts: number;
  };
  vaccinationStatus: CountItem[];
  monthlyTrend: TrendItem[];
  priorityServices: CountItem[];
  commonConditions: CountItem[];
  insights: Insight[];
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function getInsightClass(severity: InsightSeverity) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200";
  }
  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
}

interface AnalyticsHealthDashboardProps {
  endpoint: string;
  title?: string;
  subtitle?: string;
}

export function AnalyticsHealthDashboard({
  endpoint,
  title = "Analytics & Health Indicators",
  subtitle,
}: AnalyticsHealthDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = await response
            .json()
            .catch(() => ({ error: "Failed to load dashboard analytics" }));
          throw new Error(payload.error || "Failed to load dashboard analytics");
        }

        const payload = (await response.json()) as DashboardData;
        setData(payload);
      } catch (fetchError: unknown) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load dashboard analytics",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const generatedAtLabel = useMemo(() => {
    if (!data?.generatedAt) return "";
    return new Date(data.generatedAt).toLocaleString();
  }, [data?.generatedAt]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Loading barangay health analytics...
          </p>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {subtitle ||
              `Real-time health trends for ${data?.barangay || "your barangay"}.`}
          </p>
          {generatedAtLabel ? (
            <p className="mt-1 text-xs text-slate-500">
              Last updated: {generatedAtLabel} • Auto-refresh every 60 seconds
            </p>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Residents</CardDescription>
            <CardTitle className="text-3xl">{data?.kpis.totalResidents ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="h-4 w-4" />
              Covered population in your barangay
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pregnancy Cases</CardDescription>
            <CardTitle className="text-3xl">{data?.kpis.pregnancyCases ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HeartPulse className="h-4 w-4" />
              Active maternal monitoring cases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vaccination Coverage</CardDescription>
            <CardTitle className="text-3xl">
              {data?.kpis.vaccinationCoverage ?? 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Syringe className="h-4 w-4" />
              Completed vs total vaccination records
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Alerts</CardDescription>
            <CardTitle className="text-3xl">{data?.kpis.criticalAlerts ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldAlert className="h-4 w-4" />
              Critical indicators + overdue vaccinations
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>6-Month Service Trend</CardTitle>
            <CardDescription>
              Vaccinations, pregnancy-related visits, and priority services over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data?.monthlyTrend || []} margin={{ left: 6, right: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="vaccinations"
                  name="Vaccinations"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pregnancyVisits"
                  name="Pregnancy Visits"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="priorityServices"
                  name="Priority Services"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vaccination Status</CardTitle>
            <CardDescription>
              Distribution of completed, pending, and overdue records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data?.vaccinationStatus || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {(data?.vaccinationStatus || []).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Services</CardTitle>
            <CardDescription>
              Most frequently delivered services in your barangay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data?.priorityServices || []}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" name="Records" radius={[0, 8, 8, 0]} fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Medical Conditions</CardTitle>
            <CardDescription>
              Most recurring conditions from disease and indicator records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data?.commonConditions || []}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" name="Cases" radius={[0, 8, 8, 0]} fill="var(--chart-5)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automated Insights</CardTitle>
          <CardDescription>
            Generated signals to support data-driven health planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.insights || []).map((insight, index) => (
            <div
              key={`${insight.title}-${index}`}
              className={`rounded-lg border p-4 ${getInsightClass(insight.severity)}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <p className="font-semibold">{insight.title}</p>
                <Badge variant="outline" className="capitalize">
                  {insight.severity}
                </Badge>
              </div>
              <p className="text-sm">{insight.description}</p>
            </div>
          ))}

          {(!data?.insights || data.insights.length === 0) && (
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">No insights available yet.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

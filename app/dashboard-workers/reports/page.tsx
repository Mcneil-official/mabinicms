"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

type NamedCount = { name: string; value: number };
type TrendPoint = {
  month: string;
  vaccinations: number;
  maternal: number;
  senior: number;
};
type WorkerReportsPayload = {
  barangay: string;
  generatedAt: string;
  summary: { label: string; value: number }[];
  vaccinationStatus: NamedCount[];
  serviceMix: NamedCount[];
  monthlyTrend: TrendPoint[];
};

export default function ReportsPage() {
  const [data, setData] = useState<WorkerReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard-workers/reports", {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: "Failed to load worker reports" }));
        throw new Error(payload.error || "Failed to load worker reports");
      }

      const payload = (await response.json()) as WorkerReportsPayload;
      setData(payload);
    } catch (fetchError: unknown) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load worker reports",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const generatedAtLabel = useMemo(() => {
    if (!data?.generatedAt) return "";
    return new Date(data.generatedAt).toLocaleString();
  }, [data?.generatedAt]);

  const totalsBySummary = useMemo(() => {
    return (data?.summary || []).reduce(
      (acc, item) => ({ ...acc, [item.label]: item.value }),
      {} as Record<string, number>,
    );
  }, [data?.summary]);

  const reportNarrative = useMemo(() => {
    if (!data) return "";

    const totalActivities = totalsBySummary["Total Activities"] ?? 0;
    const vaccinations = totalsBySummary["Vaccinations Logged"] ?? 0;
    const maternal = totalsBySummary["Maternal Visits"] ?? 0;
    const senior = totalsBySummary["Senior Assistance"] ?? 0;

    return `This report covers ${totalActivities} recorded activities for ${data.barangay}. It includes ${vaccinations} vaccinations, ${maternal} maternal visits, and ${senior} senior assistance records.`;
  }, [data, totalsBySummary]);

  const sortedServiceMix = useMemo(() => {
    return [...(data?.serviceMix || [])].sort((left, right) => right.value - left.value);
  }, [data?.serviceMix]);

  const recentTrend = useMemo(() => {
    return [...(data?.monthlyTrend || [])].slice(-6);
  }, [data?.monthlyTrend]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Reports Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Loading City Health Worker reports...
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
            Reports Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            City Health Worker operational reports for {data?.barangay || "assigned barangay"}.
          </p>
          {generatedAtLabel ? (
            <p className="mt-1 text-xs text-slate-500">
              Last updated: {generatedAtLabel}
            </p>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={() => loadReports(true)}
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

      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
          <CardDescription>Text-based overview of the current worker report</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            {reportNarrative || "No report summary is available yet."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.summary || []).map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>6-Month Activity Trend</CardTitle>
            <CardDescription>Month-by-month text summary of worker activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrend.length > 0 ? (
                recentTrend.map((point) => (
                  <div
                    key={point.month}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {point.month}
                      </p>
                      <p className="text-xs text-slate-500">
                        Vaccinations {point.vaccinations} · Maternal {point.maternal} · Senior {point.senior}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      This month logged {point.vaccinations} vaccinations, {point.maternal} maternal records, and {point.senior} senior support entries.
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No trend data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vaccination Status</CardTitle>
            <CardDescription>Text list of logged vaccination outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.vaccinationStatus || []).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Mix</CardTitle>
          <CardDescription>Ranked text view of the most frequent services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedServiceMix.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {item.value} records
                </span>
              </div>
            ))}
            {sortedServiceMix.length === 0 ? (
              <p className="text-sm text-slate-500">No service mix data available.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Ownership</CardTitle>
          <CardDescription>Per updated module scope</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Advanced Analytics & Health Indicators are available on the Barangay Health Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

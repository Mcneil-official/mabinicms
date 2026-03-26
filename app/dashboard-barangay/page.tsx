/**
 * Barangay Health Officer Dashboard Home
 * Overview and quick access to key features
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Heart,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Activity,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalHealthWorkers: number;
  activeAssignments: number;
  pregnancyCases: number;
  highRiskCases: number;
  pendingReports: number;
  completedToday: number;
}

export default function BarangayHealthDashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalHealthWorkers: 0,
    activeAssignments: 0,
    pregnancyCases: 0,
    highRiskCases: 0,
    pendingReports: 0,
    completedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load dashboard statistics
    const loadStats = async () => {
      try {
        // In a real implementation, fetch from API
        // For now, set placeholder data
        setStats({
          totalHealthWorkers: 8,
          activeAssignments: 24,
          pregnancyCases: 12,
          highRiskCases: 3,
          pendingReports: 5,
          completedToday: 18,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Barangay Health Officer Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Oversee health workers, monitor indicators, and manage community health initiatives
        </p>
      </div>

      {/* Alert Section */}
      {stats.highRiskCases > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-4 text-red-800 dark:text-red-200">
            <strong>{stats.highRiskCases} high-risk cases</strong> require immediate attention. Review
            prenatal monitoring and medical alerts.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Health Workers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Workers</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHealthWorkers}</div>
            <p className="text-xs text-slate-500">Active in your barangay</p>
          </CardContent>
        </Card>

        {/* Active Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
            <p className="text-xs text-slate-500">Cases under supervision</p>
          </CardContent>
        </Card>

        {/* Pregnancy Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pregnancy Cases</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pregnancyCases}</div>
            <p className="text-xs text-slate-500">Currently being monitored</p>
          </CardContent>
        </Card>

        {/* High Risk Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRiskCases}</div>
            <p className="text-xs text-slate-500">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Reports
            </CardTitle>
            <CardDescription>Awaiting review and approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Field Reports Pending</span>
              <Badge variant="outline">{stats.pendingReports}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Completed Today</span>
              <Badge className="bg-green-100 text-green-800">{stats.completedToday}</Badge>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard-barangay/reports">Review Reports</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quick Access
            </CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard-barangay/health-workers">Manage Health Workers</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard-barangay/residents">View Residents</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard-barangay/analytics">Analytics & Reports</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard-barangay/pregnancy-monitoring">Pregnancy Monitoring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Worker Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Worker Performance This Week
          </CardTitle>
          <CardDescription>Service delivery and submission rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Maria Santos", submissions: 24, target: 25 },
              { name: "John Reyes", submissions: 22, target: 25 },
              { name: "Rosa Cruz", submissions: 20, target: 25 },
            ].map((worker) => (
              <div key={worker.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{worker.name}</span>
                  <span className="text-slate-500">
                    {worker.submissions}/{worker.target} submissions
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(worker.submissions / worker.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

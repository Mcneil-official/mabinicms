"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, TrendingUp, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  users_by_role: Record<string, number>;
  submissions_trend: Array<{ date: string; count: number }>;
  facility_distribution: Array<{ name: string; count: number }>;
  system_metrics: {
    total_users: number;
    total_facilities: number;
    pending_submissions: number;
    active_sessions: number;
  };
  barangay_health_stats: Array<{
    barangay: string;
    residents: number;
    workers: number;
    facilities: number;
  }>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#ef4444",
  health_worker: "#3b82f6",
  barangay_health_officer: "#a855f7",
  facility_manager: "#10b981",
  resident: "#6b7280",
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  const roleData = Object.entries(data.users_by_role).map(([role, count]) => ({
    name: role.replace(/_/g, " "),
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_metrics.total_users}</div>
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_metrics.total_facilities}</div>
            <p className="text-xs text-muted-foreground">Health centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_metrics.pending_submissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_metrics.active_sessions}</div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of users across roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name.toLowerCase().replace(/ /g, "_")] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submissions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions Trend</CardTitle>
            <CardDescription>Last 30 days of submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.submissions_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Facility Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Distribution</CardTitle>
          <CardDescription>Submissions and activity by facility</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.facility_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Barangay Health Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Barangay Health Statistics</CardTitle>
          <CardDescription>Health workers, facilities, and residents by barangay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Barangay</th>
                  <th className="text-right py-3 px-4">Health Workers</th>
                  <th className="text-right py-3 px-4">Facilities</th>
                  <th className="text-right py-3 px-4">Residents</th>
                </tr>
              </thead>
              <tbody>
                {data.barangay_health_stats.map((barangay) => (
                  <tr key={barangay.barangay} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-4 font-medium">{barangay.barangay}</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="outline">{barangay.workers}</Badge>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="outline">{barangay.facilities}</Badge>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">{barangay.residents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

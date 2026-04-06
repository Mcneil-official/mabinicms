"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardStats {
  users?: { total: number; active: number; inactive: number; byRole: Record<string, number> };
  residents?: { total: number; profiles: number };
  facilities?: { total: number; byBarangay: Record<string, number> };
  activity?: { logsLast24Hours: number; totalLogs: number };
  yakap?: { total: number; byStatus: Record<string, number> };
  appointments?: { total: number; byStatus: Record<string, number> };
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  description?: string;
}

export function AdminDashboardOverview() {
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
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, description }: StatCardProps) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats?.users?.total || 0}
          description={`${stats?.users?.active || 0} active`}
        />
        <StatCard
          icon={Users}
          title="Residents"
          value={stats?.residents?.total || 0}
          description={`${stats?.residents?.profiles || 0} profiles`}
        />
        <StatCard
          icon={Activity}
          title="Activity (24h)"
          value={stats?.activity?.logsLast24Hours || 0}
          description="Audit actions"
        />
        <StatCard
          icon={AlertCircle}
          title="Facilities"
          value={stats?.facilities?.total || 0}
          description="Health centers"
        />
      </div>

      {/* User Breakdown */}
      {stats?.users?.byRole && (
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Current user distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{role.replace("_", " ")}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats?.yakap && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Yakap Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{stats.yakap.total}</span>
                </div>
                {Object.entries(stats.yakap.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status}</span>
                    <span>{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.appointments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{stats.appointments.total}</span>
                </div>
                {Object.entries(stats.appointments.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status}</span>
                    <span>{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

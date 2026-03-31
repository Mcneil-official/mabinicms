"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Calendar, TrendingUp, Map } from "lucide-react";
import {
  getVaccinationCoverageByBarangay,
  getMaternalHealthStats,
  getSeniorCitizenStats,
  getPendingHealthInterventions,
  getHealthTrendsOverTime,
  getUnderservedAreas,
  getBarangayHealthStatus,
  getIndicatorsByType,
  getIndicatorsByStatus,
} from "@/lib/queries/health-indicators";
import {
  SimpleBarChart,
  HealthTrendLineChart,
  HealthStatusPieChart,
  CombinedHealthChart,
} from "@/components/dashboard/chart-components";
import {
  BarangayMap,
  UnderservedAreasHighlight,
} from "@/components/dashboard/barangay-map";
import {
  KeyMetricsGrid,
  VaccinationMetrics,
  MaternalHealthMetrics,
  SeniorCitizenMetrics,
  PendingInterventionsMetrics,
} from "@/components/dashboard/health-metrics-cards";

interface BarangayHealthData {
  barangay: string;
  vaccination_coverage: number;
  pending_interventions: number;
  health_status: "normal" | "warning" | "critical";
}

export default function HealthWorkersDashboard() {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // State for all data
  const [vaccinationData, setVaccinationData] = useState<any[]>([]);
  const [maternalHealthStats, setMaternalHealthStats] = useState<any>(null);
  const [seniorCitizenStats, setSeniorCitizenStats] = useState<any>(null);
  const [pendingInterventions, setPendingInterventions] = useState<any[]>([]);
  const [healthTrends, setHealthTrends] = useState<any[]>([]);
  const [barangayHealthStatus, setBarangayHealthStatus] = useState<
    BarangayHealthData[]
  >([]);
  const [indicatorsByType, setIndicatorsByType] = useState<any[]>([]);
  const [indicatorsByStatus, setIndicatorsByStatus] = useState<any[]>([]);
  const [underservedAreas, setUnderservedAreas] = useState<any[]>([]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [
        vaccData,
        maternalData,
        seniorData,
        interventions,
        trends,
        barangayStatus,
        typeIndicators,
        statusIndicators,
        underserved,
      ] = await Promise.all([
        getVaccinationCoverageByBarangay(selectedYear),
        getMaternalHealthStats(
          selectedBarangay === "all" ? undefined : selectedBarangay,
          selectedYear,
        ),
        getSeniorCitizenStats(
          selectedBarangay === "all" ? undefined : selectedBarangay,
          selectedYear,
        ),
        getPendingHealthInterventions(
          selectedBarangay === "all" ? undefined : selectedBarangay,
        ),
        getHealthTrendsOverTime(
          selectedBarangay === "all" ? undefined : selectedBarangay,
          30,
        ),
        getBarangayHealthStatus(),
        getIndicatorsByType(),
        getIndicatorsByStatus(),
        getUnderservedAreas(),
      ]);

      setVaccinationData(vaccData || []);
      setMaternalHealthStats(maternalData);
      setSeniorCitizenStats(seniorData);
      setPendingInterventions(interventions || []);
      setHealthTrends(trends || []);
      setBarangayHealthStatus((barangayStatus || []) as BarangayHealthData[]);
      setIndicatorsByType(typeIndicators || []);
      setIndicatorsByStatus(statusIndicators || []);
      setUnderservedAreas(underserved || []);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedBarangay]);

  // Calculate key metrics
  const totalVaccinations = vaccinationData.reduce(
    (sum, item) => sum + item.completed,
    0,
  );
  const totalPendingInterventions = pendingInterventions.length;

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  const barangays = [
    "all",
    ...Array.from(new Set(barangayHealthStatus.map((b) => b.barangay))),
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Health Workers Dashboard</h1>
              <p className="text-gray-600 mt-2">
                MabiniCare Community Health System
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {lastRefresh && (
            <p className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Barangay</label>
                <Select
                  value={selectedBarangay}
                  onValueChange={setSelectedBarangay}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay === "all" ? "All Barangays" : barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="warning">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Key Health Indicators</h2>
          <KeyMetricsGrid
            vaccinationCompleted={totalVaccinations}
            maternalHealthVisits={maternalHealthStats?.total_visits || 0}
            seniorsCared={seniorCitizenStats?.total_seniors_assisted || 0}
            pendingInterventions={totalPendingInterventions}
          />
        </div>

        {/* Detailed Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vaccination Metrics */}
          <VaccinationMetrics
            total={vaccinationData.reduce((sum, item) => sum + item.total, 0)}
            completed={totalVaccinations}
            pending={vaccinationData.reduce(
              (sum, item) => sum + item.pending,
              0,
            )}
            overdue={vaccinationData.reduce(
              (sum, item) => sum + item.overdue,
              0,
            )}
          />

          {/* Pending Interventions */}
          <PendingInterventionsMetrics
            count={totalPendingInterventions}
            criticalCount={
              pendingInterventions.filter((i) => i.status === "critical").length
            }
            warningCount={
              pendingInterventions.filter((i) => i.status === "warning").length
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Maternal Health Metrics */}
          {maternalHealthStats && (
            <MaternalHealthMetrics
              totalVisits={maternalHealthStats.total_visits}
              uniqueMothers={maternalHealthStats.unique_mothers}
              criticalCases={maternalHealthStats.critical_cases}
              warningCases={maternalHealthStats.warning_cases}
              normalCases={maternalHealthStats.normal_cases}
            />
          )}

          {/* Senior Citizens Metrics */}
          {seniorCitizenStats && (
            <SeniorCitizenMetrics
              totalAssisted={seniorCitizenStats.total_seniors_assisted}
              activeAssistance={seniorCitizenStats.active_assistance}
              completedAssistance={seniorCitizenStats.completed_assistance}
              totalHealthChecks={seniorCitizenStats.total_health_checks}
              criticalCases={seniorCitizenStats.critical_cases}
              warningCases={seniorCitizenStats.warning_cases}
            />
          )}
        </div>

        {/* Barangay Map Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Barangay-Level Overview</h2>
          <BarangayMap
            data={barangayHealthStatus}
            onBarangaySelect={(barangay) => setSelectedBarangay(barangay)}
            title="Interactive Barangay Health Status"
            description="Vaccination coverage and health intervention status by barangay"
          />
        </div>

        {/* Underserved Areas Alert */}
        {underservedAreas.length > 0 && (
          <UnderservedAreasHighlight
            data={barangayHealthStatus.filter(
              (b) =>
                underservedAreas.some((u) => u.barangay === b.barangay) ||
                b.health_status !== "normal",
            )}
            onBarangaySelect={(barangay) => setSelectedBarangay(barangay)}
          />
        )}

        {/* Charts Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Data Visualizations</h2>

          {/* Vaccination Coverage by Barangay */}
          {vaccinationData.length > 0 && (
            <SimpleBarChart
              title="Vaccination Coverage by Barangay"
              description="Percentage of completed vaccinations per barangay"
              data={vaccinationData}
              dataKey="coverage_percentage"
              nameKey="barangay"
              color="#3b82f6"
              height={400}
            />
          )}

          {/* Health Trends Over Time */}
          {healthTrends.length > 0 && (
            <HealthTrendLineChart
              title="Health Status Trends (Last 30 Days)"
              description="Monitor health indicator status changes over time"
              data={healthTrends}
              lines={[
                { key: "normal", color: "#10b981", name: "Normal" },
                { key: "warning", color: "#f59e0b", name: "Warning" },
                { key: "critical", color: "#ef4444", name: "Critical" },
              ]}
              height={400}
            />
          )}

          {/* Demographics - Charts in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Distribution */}
            {indicatorsByStatus.length > 0 && (
              <HealthStatusPieChart
                title="Health Status Distribution"
                description="Current status of all recorded health indicators"
                data={indicatorsByStatus}
                height={300}
              />
            )}

            {/* Indicator Types Distribution */}
            {indicatorsByType.length > 0 && (
              <SimpleBarChart
                title="Indicator Types Distribution"
                description="Frequency of each health indicator type"
                data={indicatorsByType}
                dataKey="count"
                nameKey="type"
                color="#8b5cf6"
                height={300}
              />
            )}
          </div>

          {/* Combined Health Coverage Analysis */}
          {vaccinationData.length > 0 && (
            <CombinedHealthChart
              title="Barangay Health Coverage Analysis"
              description="Vaccination and intervention status by barangay"
              data={vaccinationData.slice(0, 10)}
              bars={[
                {
                  key: "completed",
                  color: "#10b981",
                  name: "Vaccinations Completed",
                },
                {
                  key: "pending",
                  color: "#f59e0b",
                  name: "Vaccinations Pending",
                },
              ]}
              lines={[
                {
                  key: "coverage_percentage",
                  color: "#3b82f6",
                  name: "Coverage %",
                },
              ]}
              height={350}
            />
          )}
        </div>

        {/* Pending Interventions Table */}
        {pendingInterventions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Pending Health Interventions ({totalPendingInterventions})
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Actions</CardTitle>
                <CardDescription>
                  Health cases requiring immediate or near-term intervention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingInterventions.slice(0, 20).map((intervention) => (
                    <div
                      key={intervention.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        intervention.status === "critical"
                          ? "border-red-400 bg-red-50"
                          : "border-yellow-400 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {intervention.residents?.full_name ||
                                "Unknown Resident"}
                            </h4>
                            <Badge
                              className={
                                intervention.status === "critical"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }
                            >
                              {intervention.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {intervention.indicator_type.replace(/_/g, " ")}:{" "}
                            {intervention.value} {intervention.unit}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {intervention.residents?.barangay} •{" "}
                            {new Date(
                              intervention.recorded_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {totalPendingInterventions > 20 && (
                    <div className="text-center py-4">
                      <Button variant="ghost" className="text-blue-600">
                        View All {totalPendingInterventions} Interventions
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

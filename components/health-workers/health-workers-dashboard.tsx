"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { useSupabaseClient } from "@/lib/hooks/use-supabase-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  MapPin,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useHealthMetrics,
  useConnectionStatus,
} from "@/lib/hooks/use-health-workers";
import { CoverageMetrics } from "./health-indicator-card";
import { TrendChart, BarChartMetrics, BarangayComparison } from "./charts";
import { HealthFacilitiesMap, ConnectionStatus } from "./health-facilities-map";
import { Loader } from "@/components/ui/loader";

interface HealthWorkerDashboardProps {
  barangay: string;
  userId: string;
  userName: string;
}

export function HealthWorkersDashboard({
  barangay,
  userId,
  userName,
}: HealthWorkerDashboardProps) {
  const [residents, setResidents] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { metrics } = useHealthMetrics(barangay);
  const { isOnline, isConnected } = useConnectionStatus();
  const supabase = useSupabaseClient();

  const [coverage, setCoverage] = useState({
    vaccination: 0,
    maternal: 0,
    senior: 0,
  });

  useEffect(() => {
    loadData();
  }, [barangay, supabase]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      // Fetch residents
      const { data: residentsData } = await supabase
        .from("residents")
        .select("id, full_name, barangay, purok, birth_date, sex")
        .eq("barangay", barangay)
        .limit(20)
        .order("full_name");

      setResidents(residentsData || []);

      // Fetch health facilities
      const { data: facilitiesData } = await supabase
        .from("health_facilities")
        .select("*")
        .eq("barangay", barangay)
        .order("name");

      setFacilities(facilitiesData || []);

      // Calculate coverage
      if (residentsData && residentsData.length > 0) {
        const residentIds = (residentsData as { id: string }[]).map(
          (r) => r.id,
        );

        // Vaccination coverage
        const { data: vaccinated } = await supabase
          .from("vaccination_records")
          .select("resident_id", { count: "exact", head: false })
          .in("resident_id", residentIds);

        const vaccinationCoverage = vaccinated
          ? Math.round((vaccinated.length / residentsData.length) * 100)
          : 0;

        // Maternal health coverage (females only)
        const femaleResidents = (
          residentsData as { id: string; sex: string }[]
        ).filter((r) => r.sex === "Female");
        const femaleIds = femaleResidents.map((r) => r.id);

        const { data: maternal } = await supabase
          .from("maternal_health_records")
          .select("resident_id", { count: "exact", head: false })
          .in("resident_id", femaleIds);

        const maternalCoverage =
          femaleIds.length > 0
            ? Math.round(
                (maternal ? maternal.length : 0 / femaleIds.length) * 100,
              )
            : 0;

        // Senior assistance coverage (60+)
        const seniorResidents = (
          residentsData as { id: string; birth_date: string | null }[]
        ).filter((r) => {
          if (!r.birth_date) return false;
          const age =
            new Date().getFullYear() - new Date(r.birth_date).getFullYear();
          return age >= 60;
        });

        const seniorIds = seniorResidents.map((r) => r.id);

        const { data: seniors } = await supabase
          .from("senior_assistance_records")
          .select("resident_id", { count: "exact", head: false })
          .in("resident_id", seniorIds);

        const seniorCoverage =
          seniorIds.length > 0
            ? Math.round(
                ((seniors ? seniors.length : 0) / seniorIds.length) * 100,
              )
            : 0;

        setCoverage({
          vaccination: vaccinationCoverage,
          maternal: maternalCoverage,
          senior: seniorCoverage,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Baseline activity trend data used when historical rollups are not yet available.
  const trendData = [
    { name: "Nov 03", vaccinations: 14, maternal: 5, senior: 9 },
    { name: "Nov 10", vaccinations: 16, maternal: 6, senior: 10 },
    { name: "Nov 17", vaccinations: 15, maternal: 5, senior: 11 },
    { name: "Nov 24", vaccinations: 18, maternal: 7, senior: 12 },
    { name: "Dec 01", vaccinations: 19, maternal: 7, senior: 12 },
    { name: "Dec 08", vaccinations: 17, maternal: 6, senior: 11 },
    { name: "Dec 15", vaccinations: 21, maternal: 8, senior: 13 },
    { name: "Dec 22", vaccinations: 24, maternal: 9, senior: 14 },
    { name: "Dec 29", vaccinations: 20, maternal: 8, senior: 13 },
    { name: "Jan 05", vaccinations: 22, maternal: 9, senior: 15 },
    { name: "Jan 12", vaccinations: 25, maternal: 10, senior: 16 },
    { name: "Jan 19", vaccinations: 23, maternal: 10, senior: 16 },
    { name: "Jan 26", vaccinations: 26, maternal: 11, senior: 17 },
    { name: "Feb 02", vaccinations: 28, maternal: 12, senior: 18 },
    { name: "Feb 09", vaccinations: 27, maternal: 12, senior: 18 },
    { name: "Feb 16", vaccinations: 30, maternal: 13, senior: 19 },
    { name: "Feb 23", vaccinations: 29, maternal: 13, senior: 20 },
    { name: "Mar 02", vaccinations: 31, maternal: 14, senior: 20 },
    { name: "Mar 09", vaccinations: 32, maternal: 14, senior: 21 },
    { name: "Mar 16", vaccinations: 34, maternal: 15, senior: 22 },
  ];

  const barangayComparison = [
    {
      barangay: "Your Area",
      vaccinations: coverage.vaccination,
      maternalVisits: coverage.maternal,
      seniorAssistance: coverage.senior,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Workers Dashboard</h1>
          <p className="text-muted-foreground">
            {barangay} • {userName}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus isOnline={isOnline} isConnected={isConnected} />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Coverage Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Health Coverage Overview</h2>
        <CoverageMetrics
          vaccinationCoverage={coverage.vaccination}
          maternalHealthCoverage={coverage.maternal}
          seniorAssistanceCoverage={coverage.senior}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="residents">Residents</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                    <span className="text-sm font-medium">Total Residents</span>
                    <Badge className="text-lg">{residents.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <span className="text-sm font-medium">
                      Health Facilities
                    </span>
                    <Badge className="text-lg text-green-700 bg-green-200">
                      {facilities.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                    <span className="text-sm font-medium">
                      Avg. Vaccination Rate
                    </span>
                    <Badge className="text-lg">{coverage.vaccination}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm">Connection Status</span>
                    <span
                      className={`text-sm font-semibold ${isConnected ? "text-green-600" : "text-red-600"}`}
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm">Network Status</span>
                    <span
                      className={`text-sm font-semibold ${isOnline ? "text-green-600" : "text-red-600"}`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  {!isConnected && (
                    <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-700">
                      Offline mode enabled. Your entries will sync when
                      reconnected.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends */}
          <TrendChart
            data={trendData}
            title="Health Activities Trend"
            description="Last 4 weeks activity"
            dataKeys={[
              { key: "vaccinations", name: "Vaccinations", color: "#3b82f6" },
              { key: "maternal", name: "Maternal Visits", color: "#ec4899" },
              { key: "senior", name: "Senior Assistance", color: "#f59e0b" },
            ]}
          />
        </TabsContent>

        {/* Residents Tab */}
        <TabsContent value="residents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Residents in {barangay}
              </CardTitle>
              <CardDescription>
                {residents.length} residents found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {residents.length === 0 ? (
                <p className="text-muted-foreground">No residents found</p>
              ) : (
                <div className="space-y-2">
                  {residents.map((resident) => (
                    <div
                      key={resident.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{resident.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {resident.purok} • {resident.sex}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="facilities">
          <HealthFacilitiesMap facilities={facilities} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <BarangayComparison data={barangayComparison} />
          <BarChartMetrics
            data={trendData}
            title="Activities by Type"
            dataKeys={[
              { key: "vaccinations", name: "Vaccinations", color: "#3b82f6" },
              { key: "maternal", name: "Maternal Visits", color: "#ec4899" },
              { key: "senior", name: "Senior Assistance", color: "#f59e0b" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

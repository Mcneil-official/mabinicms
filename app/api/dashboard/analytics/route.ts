import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSession } from "@/lib/auth";

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

type AnalyticsPayload = {
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

type BarangayProfileAnalyticsRow = {
  id: string;
  is_pregnant: string | null;
  pregnancy_risk_level: string | null;
  prenatal_checkup_date: string | null;
  updated_at: string | null;
  past_medical_history: string | null;
  family_history: string | null;
};

function canViewDashboardAnalytics(role: string) {
  return role === "admin" || role === "barangay_admin" || role === "staff";
}

function bucketMonth(dateInput: string | null | undefined) {
  if (!dateInput) return "Unknown";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short" });
}

function toTopItems(counter: Record<string, number>, limit = 6): CountItem[] {
  return Object.entries(counter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function normalizeLabel(value: string | null | undefined) {
  if (!value) return "Unspecified";
  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseHistorySelections(value: string | null | undefined) {
  if (!value) return [] as string[];
  return value
    .split("|")
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && item !== "none");
}

function isMissingTableError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table") === true
  );
}

async function fetchFromFirstExistingTable<T>(
  db: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  tableNames: string[],
  selectClause: string,
  residentIds: string[],
) {
  for (const tableName of tableNames) {
    const result = await db
      .schema("public")
      .from(tableName)
      .select(selectClause)
      .in("resident_id", residentIds);

    if (!result.error) {
      return result.data as T[];
    }

    if (!isMissingTableError(result.error)) {
      throw result.error;
    }
  }

  return [] as T[];
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canViewDashboardAnalytics(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scopedBarangay = session.user.assigned_barangay || "";
    const supabase = await createServerSupabaseClient();
    const db = supabase.schema("public");

    const residentsResult = await (scopedBarangay
      ? db
          .from("residents")
          .select("id")
          .eq("barangay", scopedBarangay)
      : db.from("residents").select("id, barangay"));

    if (residentsResult.error) {
      throw residentsResult.error;
    }

    const residents = residentsResult.data || [];
    const residentIds = residents
      .map((resident) => resident.id)
      .filter((id): id is string => Boolean(id));

    const barangayProfilesQuery = scopedBarangay
      ? db
          .from("barangay_profiles")
          .select(
            "id, is_pregnant, pregnancy_risk_level, prenatal_checkup_date, updated_at",
          )
          .eq("current_barangay", scopedBarangay)
      : db
          .from("barangay_profiles")
          .select(
            "id, is_pregnant, pregnancy_risk_level, prenatal_checkup_date, updated_at",
          );

    const { data: barangayProfiles, error: barangayProfilesError } =
      await barangayProfilesQuery;

    if (barangayProfilesError && !isMissingTableError(barangayProfilesError)) {
      throw barangayProfilesError;
    }

    const profileRows = (barangayProfiles || []) as BarangayProfileAnalyticsRow[];

    const pregnancyProfiles = profileRows.filter(
      (profile) => profile.is_pregnant === "yes",
    );

    const totalResidents = profileRows.length > 0 ? profileRows.length : residentIds.length;
    const barangayLabel = scopedBarangay || "All Barangays";

    const emptyPayload: AnalyticsPayload = {
      barangay: barangayLabel,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalResidents,
        pregnancyCases: 0,
        vaccinationCoverage: 0,
        criticalAlerts: 0,
      },
      vaccinationStatus: [
        { name: "Completed", value: 0 },
        { name: "Pending", value: 0 },
        { name: "Overdue", value: 0 },
      ],
      monthlyTrend: Array.from({ length: 6 }).map((_, idx) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - idx));
        return {
          month: date.toLocaleDateString("en-US", { month: "short" }),
          vaccinations: 0,
          pregnancyVisits: 0,
          priorityServices: 0,
        };
      }),
      priorityServices: [],
      commonConditions: [],
      insights: [
        {
          title: "No records available",
          description: "No barangay profiling records found for this scope yet.",
          severity: "warning",
        },
      ],
    };

    if (profileRows.length === 0 && residentIds.length === 0) {
      return NextResponse.json(emptyPayload);
    }

    const vaccinations =
      residentIds.length > 0
        ? await fetchFromFirstExistingTable<{
            resident_id: string;
            vaccine_name: string | null;
            vaccine_date: string | null;
            status: string | null;
          }>(
            supabase,
            ["vaccination_records"],
            "resident_id, vaccine_name, vaccine_date, status",
            residentIds,
          )
        : [];

    const completedVaccinations = vaccinations.filter(
      (item) => item.status === "completed",
    ).length;
    const pendingVaccinations = vaccinations.filter(
      (item) => item.status === "pending",
    ).length;
    const overdueVaccinations = vaccinations.filter(
      (item) => item.status === "overdue",
    ).length;

    const vaccinationCoverage =
      vaccinations.length > 0
        ? Math.round((completedVaccinations / vaccinations.length) * 100)
        : 0;

    const pregnancyCases = pregnancyProfiles.length;

    const highRiskPregnancyProfiles = pregnancyProfiles.filter(
      (profile) => profile.pregnancy_risk_level === "high",
    ).length;

    const medicalHistoryProfiles = profileRows.filter(
      (profile) => parseHistorySelections(profile.past_medical_history).length > 0,
    ).length;

    const familyHistoryProfiles = profileRows.filter(
      (profile) => parseHistorySelections(profile.family_history).length > 0,
    ).length;

    const criticalAlerts = overdueVaccinations + highRiskPregnancyProfiles;

    const serviceCounter: Record<string, number> = {};
    serviceCounter["Prenatal Monitoring"] = pregnancyCases;
    serviceCounter["High-Risk Pregnancy Follow-up"] = highRiskPregnancyProfiles;
    serviceCounter["Medical History Review"] = medicalHistoryProfiles;
    serviceCounter["Family History Monitoring"] = familyHistoryProfiles;
    vaccinations.forEach((item) => {
      const key = normalizeLabel(item.vaccine_name || "Vaccination");
      serviceCounter[key] = (serviceCounter[key] || 0) + 1;
    });

    const priorityServices = toTopItems(serviceCounter, 6);

    const conditionCounter: Record<string, number> = {};
    profileRows.forEach((profile) => {
      const conditions = [
        ...parseHistorySelections(profile.past_medical_history),
        ...parseHistorySelections(profile.family_history),
      ];

      conditions.forEach((condition) => {
        const key = normalizeLabel(condition);
        conditionCounter[key] = (conditionCounter[key] || 0) + 1;
      });
    });

    const commonConditions = toTopItems(conditionCounter, 6);

    const now = new Date();
    const monthKeys = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return date.toLocaleDateString("en-US", { month: "short" });
    });

    const trendMap: Record<string, TrendItem> = {};
    monthKeys.forEach((key) => {
      trendMap[key] = {
        month: key,
        vaccinations: 0,
        pregnancyVisits: 0,
        priorityServices: 0,
      };
    });

    vaccinations.forEach((item) => {
      const key = bucketMonth(item.vaccine_date);
      if (trendMap[key]) trendMap[key].vaccinations += 1;
    });

    pregnancyProfiles.forEach((profile) => {
      const key = bucketMonth(profile.prenatal_checkup_date || profile.updated_at);
      if (trendMap[key]) trendMap[key].pregnancyVisits += 1;
    });

    profileRows.forEach((profile) => {
      const key = bucketMonth(profile.updated_at);
      if (trendMap[key]) trendMap[key].priorityServices += 1;
    });

    const monthlyTrend = monthKeys.map((key) => trendMap[key]);

    const insights: Insight[] = [];

    if (vaccinationCoverage >= 90) {
      insights.push({
        title: "Strong vaccination performance",
        description: `${vaccinationCoverage}% of vaccination records are completed in ${barangayLabel}.`,
        severity: "positive",
      });
    } else if (vaccinationCoverage >= 75) {
      insights.push({
        title: "Vaccination coverage needs improvement",
        description: `Coverage is ${vaccinationCoverage}%. Focus follow-up on pending and overdue doses.`,
        severity: "warning",
      });
    } else {
      insights.push({
        title: "Low vaccination coverage detected",
        description: `Coverage is ${vaccinationCoverage}%. Prioritize immunization outreach this week.`,
        severity: "critical",
      });
    }

    if (pregnancyCases > 0) {
      insights.push({
        title: "Active maternal monitoring",
        description: `${pregnancyCases} pregnancy cases are currently tracked. Keep prenatal schedules on time.`,
        severity: "warning",
      });
    }

    if (criticalAlerts > 0) {
      insights.push({
        title: "Urgent follow-ups required",
        description: `${criticalAlerts} critical/overdue alerts need immediate review.`,
        severity: "critical",
      });
    }

    const topCondition = commonConditions[0];
    if (topCondition) {
      insights.push({
        title: "Most common condition focus",
        description: `${topCondition.name} appears most often (${topCondition.value} records). Consider targeted education and prevention.`,
        severity: "warning",
      });
    }

    if (insights.length === 0) {
      insights.push({
        title: "No critical trends detected",
        description: "Current records show stable indicators with no urgent flags.",
        severity: "positive",
      });
    }

    const payload: AnalyticsPayload = {
      barangay: barangayLabel,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalResidents,
        pregnancyCases,
        vaccinationCoverage,
        criticalAlerts,
      },
      vaccinationStatus: [
        { name: "Completed", value: completedVaccinations },
        { name: "Pending", value: pendingVaccinations },
        { name: "Overdue", value: overdueVaccinations },
      ],
      monthlyTrend,
      priorityServices,
      commonConditions,
      insights,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[GET /api/dashboard/analytics]", error);
    return NextResponse.json(
      { error: "Failed to load analytics dashboard data" },
      { status: 500 },
    );
  }
}

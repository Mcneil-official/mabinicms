/**
 * Server Component Wrapper for GIS Map with Database Integration
 * Fetches real vaccination data from the database
 */

import React from "react";
import { BarangayGisMapIntegrated } from "./barangay-gis-map-integrated";
import { getGisMapVaccinationData } from "@/lib/queries/gis-map-data";

interface BarangayGisMapDatabaseProps {
  title?: string;
  description?: string;
  mapHeight?: string;
  showLegend?: boolean;
  showMapLegend?: boolean;
  fallbackToHealthcareData?: boolean;
}

/**
 * Database-Connected GIS Map Component
 *
 * This is a server component that fetches vaccination data from the database
 * and renders the interactive GIS map.
 *
 * Usage:
 * ```tsx
 * import { BarangayGisMapDatabase } from "@/components/dashboard/barangay-gis-map-database";
 *
 * export default function Page() {
 *   return <BarangayGisMapDatabase />;
 * }
 * ```
 */
export async function BarangayGisMapDatabase({
  title = "Naga City Barangay Vaccination Coverage",
  description = "Real-time vaccination coverage data from database",
  mapHeight = "h-[600px]",
  showLegend = true,
  showMapLegend = true,
  fallbackToHealthcareData = true,
}: BarangayGisMapDatabaseProps) {
  // Fetch real data from database
  const vaccinationData = await getGisMapVaccinationData();

  // Check if we got data
  const hasData = vaccinationData && vaccinationData.length > 0;

  return (
    <BarangayGisMapIntegrated
      data={hasData ? vaccinationData : undefined}
      useFallbackData={!hasData && fallbackToHealthcareData}
      title={title}
      description={
        hasData
          ? description
          : "Using fallback healthcare records while live vaccination data is being populated"
      }
      mapHeight={mapHeight}
      showLegend={showLegend}
      showMapLegend={showMapLegend}
    />
  );
}

export default BarangayGisMapDatabase;

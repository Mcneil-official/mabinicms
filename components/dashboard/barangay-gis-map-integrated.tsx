"use client";

import React, { useState } from "react";
import type { BarangayVaccinationData } from "./barangay-gis-map";
import { BarangayGisMap } from "./barangay-gis-map";
import { fallbackBarangayHealthData } from "./fallback-barangay-health-data";
import {
  BarangayStatsPanel,
  type BarangayStatsData,
} from "./barangay-stats-panel";
import { BarangayVaccinationLegend } from "./barangay-vaccination-legend";

interface BarangayGisMapIntegratedProps {
  data?: BarangayVaccinationData[];
  useFallbackData?: boolean;
  title?: string;
  description?: string;
  mapHeight?: string;
  showLegend?: boolean;
  showMapLegend?: boolean;
}

/**
 * Fallback vaccination data for initial dashboard use
 * Using all 27 actual barangays from Naga City, Bicol
 */
function getFallbackData(): BarangayVaccinationData[] {
  return fallbackBarangayHealthData.map((record) => ({ ...record }));
}

/**
 * Integrated GIS Map Component with Stats Panel
 *
 * This component combines the Leaflet map, stats panel, and legend into a cohesive feature.
 * It handles state management for selected barangays and provides a complete user experience.
 *
 * Usage:
 * <BarangayGisMapIntegrated useFallbackData={true} />
 *
 * or with real data:
 * <BarangayGisMapIntegrated data={realVaccinationData} />
 */
export function BarangayGisMapIntegrated({
  data,
  useFallbackData = true,
  title = "Naga City Barangay Health Coverage",
  description = "Interactive marker-based visualization of vaccination coverage across Naga City, Bicol barangays",
  mapHeight = "h-[600px]",
  showLegend = true,
  showMapLegend = true,
}: BarangayGisMapIntegratedProps) {
  const [selectedBarangay, setSelectedBarangay] =
    useState<BarangayStatsData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Use realistic fallback records if live data is unavailable.
  const displayData = data || (useFallbackData ? getFallbackData() : []);

  const handleBarangaySelect = (
    barangayName: string,
    barangayData: BarangayVaccinationData,
  ) => {
    setSelectedBarangay(barangayData as BarangayStatsData);
    setIsPanelOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Map Component */}
      <BarangayGisMap
        data={displayData}
        onBarangaySelect={handleBarangaySelect}
        title={title}
        description={description}
        height={mapHeight}
        showLegend={showMapLegend}
      />

      {/* Legend Component */}
      {showLegend && (
        <BarangayVaccinationLegend
          title="Vaccination Coverage Guide"
          description="Understand the color coding and interaction features of the map"
          showDetail={true}
        />
      )}

      {/* Stats Panel - slides in from right when barangay is clicked */}
      <BarangayStatsPanel
        data={selectedBarangay}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}

export default BarangayGisMapIntegrated;

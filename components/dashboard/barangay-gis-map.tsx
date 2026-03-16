"use client";

import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
  useMap,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCoverageColor,
  getCoverageOpacity,
  formatPercentage,
} from "@/lib/utils/barangay-coverage-utils";
import {
  mockBarangayGeoJSON,
  getBarangayCenter,
  type BarangayGeoFeature,
} from "@/lib/utils/mock-barangay-geojson";
import { fallbackBarangayHealthData } from "./fallback-barangay-health-data";
import { ChevronDown, FlaskConical } from "lucide-react";

// Create custom map pin marker icons based on coverage level
const createCustomIcon = (coverage: number, barangayName: string) => {
  const color = getCoverageColor(coverage);
  const fillColor = color.fill;

  // Map pin SVG with barangay name label
  const svgIcon = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${barangayName.replace(/\s/g, "")}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Pin shape -->
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.627 18 30 18 30s18-17.373 18-30C36 8.06 27.94 0 18 0z" 
            fill="${fillColor}" 
            stroke="#fff" 
            stroke-width="2"
            filter="url(#shadow-${barangayName.replace(/\s/g, "")})"/>
      <!-- Inner circle -->
      <circle cx="18" cy="16" r="10" fill="#fff" opacity="0.95"/>
      <!-- Health icon (heart/pulse symbol) -->
      <path d="M18 12c-0.5-0.5-1.3-0.8-2-0.8-1.5 0-2.7 1.2-2.7 2.7 0 2.5 4.7 5.8 4.7 5.8s4.7-3.3 4.7-5.8c0-1.5-1.2-2.7-2.7-2.7-0.7 0-1.5 0.3-2 0.8z" 
            fill="${fillColor}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker-icon",
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  });
};

export interface BarangayVaccinationData {
  barangay: string;
  vaccination_coverage: number;
  pending_interventions: number;
  total_residents: number;
  maternal_health_visits?: number;
  senior_citizens_assisted?: number;
  last_updated?: string;
}

export interface BarangayGisMapProps {
  data: BarangayVaccinationData[];
  onBarangaySelect?: (barangay: string, data: BarangayVaccinationData) => void;
  title?: string;
  description?: string;
  height?: string;
  showLegend?: boolean;
}

// Fix Leaflet icon issue
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

/**
 * Inner map component with GeoJSON layers and markers
 */
function GisMapContent({
  data,
  onBarangaySelect,
}: {
  data: BarangayVaccinationData[];
  onBarangaySelect?: (barangay: string, data: BarangayVaccinationData) => void;
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    // Create a map from barangay names to their data
    const dataMap = new Map(data.map((d) => [d.barangay, d]));
    const fallbackMap = new Map(
      fallbackBarangayHealthData.map((d) => [d.barangay, d]),
    );

    // Add markers for each barangay
    mockBarangayGeoJSON.features.forEach((feature) => {
      const barangayName = feature.properties.name;
      let barangayData = dataMap.get(barangayName);

      if (!barangayData) {
        barangayData =
          fallbackMap.get(barangayName) || {
            barangay: barangayName,
            vaccination_coverage: 0,
            pending_interventions: 0,
            total_residents: 0,
            maternal_health_visits: 0,
            senior_citizens_assisted: 0,
            last_updated: new Date().toISOString(),
          };
      }

      const coverage = barangayData.vaccination_coverage;
      const center = getBarangayCenter(feature);

      // Create marker with custom map pin icon
      const marker = L.marker([center[1], center[0]], {
        icon: createCustomIcon(coverage, barangayName),
      }).addTo(map);

      // Add popup with details
      const popupContent = `
        <div class="p-2 min-w-50">
          <h4 class="font-bold text-base mb-2">${barangayName}</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Vaccination:</span>
              <span class="font-semibold">${formatPercentage(coverage)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Residents:</span>
              <span class="font-semibold">${barangayData.total_residents.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Pending:</span>
              <span class="font-semibold">${barangayData.pending_interventions}</span>
            </div>
            ${
              barangayData.maternal_health_visits
                ? `
            <div class="flex justify-between">
              <span class="text-gray-600">Maternal Visits:</span>
              <span class="font-semibold">${barangayData.maternal_health_visits}</span>
            </div>
            `
                : ""
            }
            ${
              barangayData.senior_citizens_assisted
                ? `
            <div class="flex justify-between">
              <span class="text-gray-600">Seniors Assisted:</span>
              <span class="font-semibold">${barangayData.senior_citizens_assisted}</span>
            </div>
            `
                : ""
            }
          </div>
          <div class="mt-2 pt-2 border-t text-xs text-gray-500">
            Click for detailed view
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Handle marker events
      marker.on("click", () => {
        onBarangaySelect?.(barangayName, barangayData);
      });

      marker.on("mouseover", () => {
        setHoveredBarangay(barangayName);
        marker.openPopup();
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    return () => {
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current = [];
    };
  }, [data, map, onBarangaySelect]);

  return null;
}

/**
 * Legend component
 */
function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-40 max-w-xs">
      <h3 className="font-semibold text-sm mb-3">Vaccination Coverage</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-3 rounded"
            style={{ backgroundColor: "#EF4444" }}
          />
          <span className="text-xs">0-40% (Critical)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-3 rounded"
            style={{ backgroundColor: "#F59E0B" }}
          />
          <span className="text-xs">40-60% (Low)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-3 rounded"
            style={{ backgroundColor: "#3B82F6" }}
          />
          <span className="text-xs">60-80% (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-3 rounded"
            style={{ backgroundColor: "#10B981" }}
          />
          <span className="text-xs">80-100% (Good)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main GIS Map Component
 */
export function BarangayGisMap({
  data,
  onBarangaySelect,
  title = "Barangay Vaccination Coverage Map",
  description = "Interactive map showing Naga City barangays with color-coded vaccination coverage markers",
  height = "h-[600px]",
  showLegend = true,
}: BarangayGisMapProps) {
  const fixIconsRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!fixIconsRef.current && typeof window !== "undefined") {
      fixLeafletIcons();
      fixIconsRef.current = true;
    }
    setIsMounted(true);
  }, []);

  // Only render MapContainer on client-side
  if (typeof window === "undefined" || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}
          >
            <div className="text-center text-gray-500">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Loading map...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0" suppressHydrationWarning>
        <MapContainer
          center={[13.6219, 123.1948]}
          zoom={13}
          className={`${height} w-full rounded-lg`}
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstht">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GisMapContent data={data} onBarangaySelect={onBarangaySelect} />
          {showLegend && <MapLegend />}
        </MapContainer>
        <style jsx global>{`
          .custom-marker-icon {
            background: transparent !important;
            border: none !important;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .custom-marker-icon:hover {
            transform: scale(1.15);
            z-index: 1000 !important;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 8px !important;
            box-shadow:
              0 4px 6px -1px rgb(0 0 0 / 0.1),
              0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          }
          .leaflet-popup-content {
            margin: 0 !important;
            min-width: 200px !important;
          }
          .leaflet-popup-tip {
            background: white !important;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}

export default BarangayGisMap;

import { MABINI_BARANGAYS } from "@/lib/constants/barangays";

/**
 * GeoJSON data for Mabini barangay center points.
 * Coordinates are sourced from geocoding results for each barangay name.
 */

export interface BarangayGeoFeature {
  type: "Feature";
  properties: {
    name: string;
    barangay_code: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface BarangayGeoJSON {
  type: "FeatureCollection";
  features: BarangayGeoFeature[];
}

const MABINI_BARANGAY_COORDINATES: Record<string, [number, number]> = {
  "Anilao East": [120.9306845, 13.7604454],
  "Anilao Proper": [120.9279593, 13.7607684],
  Bagalangit: [120.8773481, 13.7107679],
  Bulacan: [120.9483308, 13.746141],
  Calamias: [120.9529602, 13.7516148],
  Estrella: [120.9273103, 13.7321105],
  Gasang: [120.9274324, 13.7217897],
  Laurel: [120.9080695, 13.720952],
  Ligaya: [120.8868969, 13.7305537],
  Mainaga: [120.9563425, 13.7609912],
  Mainit: [120.9012767, 13.6916787],
  Majuben: [120.9271788, 13.7574501],
  "Malimatoc I": [120.9118303, 13.7117437],
  "Malimatoc II": [120.9128612, 13.7062491],
  "Nag-iba": [120.9000269, 13.7028043],
  Pilahan: [120.9212552, 13.7305329],
  Poblacion: [120.9406033, 13.748392],
  "Pulang Lupa": [120.927262, 13.7387963],
  "Pulong Anahao": [120.9180808, 13.744338],
  "Pulong Balibaguhan": [120.940614, 13.7436521],
  "Pulong Niogan": [120.9406154, 13.7525905],
  Saguing: [120.9294802, 13.7268121],
  Sampaguita: [120.9304833, 13.7474905],
  "San Francisco": [120.9487438, 13.7573308],
  "San Jose": [120.9198243, 13.7556825],
  "San Juan": [120.961428, 13.7701718],
  "San Teodoro": [120.8835542, 13.6996474],
  "Santa Ana": [120.9250572, 13.7508488],
  "Santa Mesa": [120.9277126, 13.7433662],
  "Santo Niño": [120.9553689, 13.768442],
  "Santo Tomas": [120.919092, 13.7269437],
  Solo: [120.9013692, 13.7478109],
  "Talaga East": [120.9360764, 13.7337579],
  "Talaga Proper": [120.9329572, 13.7309039],
};

function toFeature(barangay: string, index: number): BarangayGeoFeature {
  const coordinates = MABINI_BARANGAY_COORDINATES[barangay] ?? [120.9, 13.72];

  return {
    type: "Feature",
    properties: {
      name: barangay,
      barangay_code: `MAB-${String(index + 1).padStart(3, "0")}`,
    },
    geometry: {
      type: "Point",
      coordinates,
    },
  };
}

export const mockBarangayGeoJSON: BarangayGeoJSON = {
  type: "FeatureCollection",
  features: MABINI_BARANGAYS.map(toFeature),
};

/**
 * Get center point of a barangay (for markers/labels)
 * For Point geometries, returns the coordinates directly
 */
export function getBarangayCenter(
  barangay: BarangayGeoFeature,
): [number, number] {
  // For Point geometry, return coordinates directly
  return barangay.geometry.coordinates;
}

/**
 * Find barangay feature by name
 */
export function findBarangayByName(name: string): BarangayGeoFeature | null {
  return (
    mockBarangayGeoJSON.features.find(
      (f) => f.properties.name.toLowerCase() === name.toLowerCase(),
    ) || null
  );
}

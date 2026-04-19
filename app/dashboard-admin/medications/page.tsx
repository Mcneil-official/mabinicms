"use client";

import { MedicationInventoryModule } from "@/components/medications/medication-inventory-module";

export default function AdminMedicationsPage() {
  return (
    <div className="space-y-8">
      <MedicationInventoryModule defaultMode="cho" />
    </div>
  );
}

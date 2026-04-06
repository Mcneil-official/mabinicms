"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModuleMode = "cho" | "worker";
type DistributionAction = "allocate" | "dispense" | "restock" | "redistribute" | "adjust";

interface MedicationAllocation {
  id: string;
  medication_id: string;
  barangay: string;
  allocated_quantity: number;
  updated_at: string;
}

interface MedicationInventoryItem {
  id: string;
  medicine_name: string;
  category: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  allocations: MedicationAllocation[];
  allocated_total: number;
  central_available: number;
  days_to_expiry: number;
  is_low_stock: boolean;
  is_expiring_soon: boolean;
}

interface MedicationHistoryItem {
  id: string;
  medication_id: string;
  action_type: DistributionAction;
  quantity: number;
  barangay: string | null;
  from_barangay: string | null;
  to_barangay: string | null;
  notes: string | null;
  action_by: string | null;
  created_at: string;
  medicine_name?: string;
  category?: string;
  batch_number?: string;
}

interface MedicationAlert {
  type: "low_stock" | "expiring_soon";
  medication_id: string;
  message: string;
  severity: "warning" | "critical";
}

interface MedicationSuggestion {
  type: "restock" | "redistribute" | "prioritize_dispense";
  medication_id: string;
  message: string;
  recommended_quantity?: number;
}

interface MedicationApiResponse {
  mode: ModuleMode;
  can_manage?: boolean;
  barangay?: string;
  barangays?: string[];
  items: MedicationInventoryItem[];
  history: MedicationHistoryItem[];
  alerts: MedicationAlert[];
  suggestions: MedicationSuggestion[];
}

interface MedicationInventoryModuleProps {
  defaultMode?: ModuleMode;
}

const initialMedicationForm = {
  medicine_name: "",
  category: "",
  batch_number: "",
  quantity: "",
  expiration_date: "",
  low_stock_threshold: "20",
};

const initialDistributionForm = {
  actionType: "allocate" as DistributionAction,
  medicationId: "",
  quantity: "",
  barangay: "",
  fromBarangay: "",
  toBarangay: "",
  notes: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function MedicationInventoryModule({
  defaultMode = "cho",
}: MedicationInventoryModuleProps) {
  const [mode, setMode] = useState<ModuleMode>(defaultMode);
  const [canManage, setCanManage] = useState(false);
  const [items, setItems] = useState<MedicationInventoryItem[]>([]);
  const [history, setHistory] = useState<MedicationHistoryItem[]>([]);
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [workerBarangay, setWorkerBarangay] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [distributionSubmitting, setDistributionSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [medicationForm, setMedicationForm] = useState(initialMedicationForm);
  const [distributionForm, setDistributionForm] = useState(initialDistributionForm);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/medications", { cache: "no-store" });
      const payload = (await response.json()) as MedicationApiResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load medication inventory");
      }

      setMode(payload.mode || defaultMode);
      setCanManage(Boolean(payload.can_manage));
      setItems(payload.items || []);
      setHistory(payload.history || []);
      setAlerts(payload.alerts || []);
      setSuggestions(payload.suggestions || []);
      setBarangays(payload.barangays || []);
      setWorkerBarangay(payload.barangay || "");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load medication inventory";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [defaultMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("medication-inventory-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_inventory",
        },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_allocations",
        },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_distribution_history",
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const isCho = mode === "cho";
  const canRunDistribution = isCho;

  const medicationOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${item.medicine_name} (${item.batch_number})`,
      })),
    [items],
  );

  const resetMedicationForm = () => {
    setMedicationForm(initialMedicationForm);
    setEditingId(null);
  };

  const resetDistributionForm = () => {
    setDistributionForm(initialDistributionForm);
  };

  const handleSubmitMedication = async () => {
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        medicine_name: medicationForm.medicine_name.trim(),
        category: medicationForm.category.trim(),
        batch_number: medicationForm.batch_number.trim(),
        quantity: Number(medicationForm.quantity || 0),
        expiration_date: medicationForm.expiration_date,
        low_stock_threshold: Number(medicationForm.low_stock_threshold || 20),
      };

      if (
        !payload.medicine_name ||
        !payload.category ||
        !payload.batch_number ||
        !payload.expiration_date
      ) {
        throw new Error("Please complete all required medication fields.");
      }

      const endpoint = editingId
        ? `/api/medications/${editingId}`
        : "/api/medications";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "Failed to save medication");
      }

      setMessage(editingId ? "Medication updated." : "Medication added.");
      resetMedicationForm();
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save medication",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMedication = (item: MedicationInventoryItem) => {
    setEditingId(item.id);
    setMedicationForm({
      medicine_name: item.medicine_name,
      category: item.category,
      batch_number: item.batch_number,
      quantity: String(item.quantity),
      expiration_date: item.expiration_date,
      low_stock_threshold: String(item.low_stock_threshold),
    });
  };

  const handleSubmitDistribution = async () => {
    setDistributionSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!distributionForm.medicationId) {
        throw new Error("Please select a medication.");
      }

      const quantity = Number(distributionForm.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Please enter a valid quantity.");
      }

      const payload = {
        actionType: distributionForm.actionType,
        medicationId: distributionForm.medicationId,
        quantity,
        barangay: distributionForm.barangay || undefined,
        fromBarangay: distributionForm.fromBarangay || undefined,
        toBarangay: distributionForm.toBarangay || undefined,
        notes: distributionForm.notes || undefined,
      };

      const response = await fetch("/api/medications/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "Failed to process action");
      }

      setMessage("Inventory action recorded.");
      resetDistributionForm();
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to process action",
      );
    } finally {
      setDistributionSubmitting(false);
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    const confirmed = window.confirm(
      "Delete this medication? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/medications/${medicationId}`, {
        method: "DELETE",
      });

      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "Failed to delete medication");
      }

      if (editingId === medicationId) {
        resetMedicationForm();
      }

      setMessage("Medication deleted.");
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete medication",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Medication Inventory & Dispensing
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isCho
            ? "CHO-managed centralized medication stocks, allocations, and dispensing audit."
            : canManage
              ? `Manage medication inventory for ${workerBarangay || "your barangay"}.`
              : `View-only stock monitoring for ${workerBarangay || "your barangay"}.`}
        </p>
      </div>

      {message ? (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-700 dark:text-slate-300">
            {message}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Automated Alerts</CardTitle>
            <CardDescription>
              Warnings for low stock and medications nearing expiration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No active alerts.
              </p>
            ) : (
              alerts.slice(0, 8).map((alert) => (
                <div key={`${alert.medication_id}-${alert.type}-${alert.message}`} className="flex items-start gap-2">
                  <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                    {alert.severity}
                  </Badge>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart Suggestions</CardTitle>
            <CardDescription>
              Restock, redistribution, and dispensing prioritization recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No suggestions available.
              </p>
            ) : (
              suggestions.slice(0, 8).map((suggestion, index) => (
                <div key={`${suggestion.medication_id}-${suggestion.type}-${index}`} className="rounded border border-slate-200 p-2 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {suggestion.message}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Medication" : "Add Medication"}</CardTitle>
              <CardDescription>
                Track medicine name, category, batch, quantity, and expiration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Medicine Name</Label>
                  <Input
                    value={medicationForm.medicine_name}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        medicine_name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input
                    value={medicationForm.category}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Batch Number</Label>
                  <Input
                    value={medicationForm.batch_number}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        batch_number: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={0}
                    value={medicationForm.quantity}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={medicationForm.expiration_date}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        expiration_date: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    min={0}
                    value={medicationForm.low_stock_threshold}
                    onChange={(event) =>
                      setMedicationForm((prev) => ({
                        ...prev,
                        low_stock_threshold: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitMedication} disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Update" : "Add"}
                </Button>
                {editingId ? (
                  <Button variant="outline" onClick={resetMedicationForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {canRunDistribution ? (
            <Card>
            <CardHeader>
              <CardTitle>Inventory Action</CardTitle>
              <CardDescription>
                Record restocking, allocation, redistribution, and dispensing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Action Type</Label>
                  <Select
                    value={distributionForm.actionType}
                    onValueChange={(value: DistributionAction) =>
                      setDistributionForm((prev) => ({ ...prev, actionType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="allocate">Allocate</SelectItem>
                      <SelectItem value="redistribute">Redistribute</SelectItem>
                      <SelectItem value="dispense">Dispense</SelectItem>
                      <SelectItem value="adjust">Adjust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Medication</Label>
                  <Select
                    value={distributionForm.medicationId}
                    onValueChange={(value) =>
                      setDistributionForm((prev) => ({ ...prev, medicationId: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={distributionForm.quantity}
                    onChange={(event) =>
                      setDistributionForm((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                  />
                </div>

                {(distributionForm.actionType === "allocate" ||
                  distributionForm.actionType === "dispense") && (
                  <div className="space-y-1">
                    <Label>Barangay</Label>
                    <Select
                      value={distributionForm.barangay}
                      onValueChange={(value) =>
                        setDistributionForm((prev) => ({ ...prev, barangay: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((barangay) => (
                          <SelectItem key={barangay} value={barangay}>
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {distributionForm.actionType === "redistribute" && (
                  <>
                    <div className="space-y-1">
                      <Label>From Barangay</Label>
                      <Select
                        value={distributionForm.fromBarangay}
                        onValueChange={(value) =>
                          setDistributionForm((prev) => ({ ...prev, fromBarangay: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay} value={barangay}>
                              {barangay}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>To Barangay</Label>
                      <Select
                        value={distributionForm.toBarangay}
                        onValueChange={(value) =>
                          setDistributionForm((prev) => ({ ...prev, toBarangay: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay} value={barangay}>
                              {barangay}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  value={distributionForm.notes}
                  onChange={(event) =>
                    setDistributionForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>

              <Button onClick={handleSubmitDistribution} disabled={distributionSubmitting}>
                {distributionSubmitting ? "Processing..." : "Record Action"}
              </Button>
            </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Medication Stocks</CardTitle>
          <CardDescription>
            {isCho
              ? "Centralized stock and barangay allocation monitoring."
              : "Allocated stocks available to your barangay."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading inventory...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Central</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead>Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.medicine_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.batch_number}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.central_available}</TableCell>
                    <TableCell>
                      {item.allocations.map((allocation) => (
                        <div key={allocation.id} className="text-xs">
                          {allocation.barangay}: {allocation.allocated_quantity}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{formatDate(item.expiration_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.is_low_stock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : null}
                        {item.is_expiring_soon ? (
                          <Badge variant="secondary">Expiring</Badge>
                        ) : null}
                        {!item.is_low_stock && !item.is_expiring_soon ? (
                          <Badge variant="outline">OK</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMedication(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMedication(item.id)}
                            disabled={submitting}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}

                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 9 : 8}
                      className="text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No medications found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>
            Real-time inventory actions for accountability and audit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.created_at)}</TableCell>
                  <TableCell>
                    {record.medicine_name || "Medication"}
                    {record.batch_number ? ` (${record.batch_number})` : ""}
                  </TableCell>
                  <TableCell className="uppercase">{record.action_type}</TableCell>
                  <TableCell>{record.quantity}</TableCell>
                  <TableCell>
                    {record.barangay ||
                      (record.from_barangay && record.to_barangay
                        ? `${record.from_barangay} → ${record.to_barangay}`
                        : "-")}
                  </TableCell>
                  <TableCell>{record.notes || "-"}</TableCell>
                </TableRow>
              ))}

              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No distribution history yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

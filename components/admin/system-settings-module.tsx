"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsForm {
  notificationRetentionDays: number;
  lowStockAlertThreshold: number;
  enableMedicationAutoSuggestions: boolean;
  enableAuditCsvExport: boolean;
  systemMaintenanceMode: boolean;
  defaultAnnouncementAudience: string[];
}

const defaultForm: SettingsForm = {
  notificationRetentionDays: 180,
  lowStockAlertThreshold: 20,
  enableMedicationAutoSuggestions: true,
  enableAuditCsvExport: true,
  systemMaintenanceMode: false,
  defaultAnnouncementAudience: [],
};

export function SystemSettingsModule() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [settingsRes, barangayRes] = await Promise.all([
          fetch("/api/admin/system-settings", { cache: "no-store" }),
          fetch("/api/admin/barangays"),
        ]);

        const settingsPayload = (await settingsRes.json()) as {
          error?: string;
          settings?: SettingsForm;
        };

        if (!settingsRes.ok) {
          throw new Error(settingsPayload.error || "Failed to load settings");
        }

        setForm({ ...defaultForm, ...(settingsPayload.settings || {}) });

        if (barangayRes.ok) {
          const barangayPayload = (await barangayRes.json()) as { data: string[] };
          setBarangays(barangayPayload.data || []);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save settings");
      }

      setMessage("System settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure persistent operational defaults used by admin modules.
        </p>
      </div>

      {message ? (
        <Card>
          <CardContent className="pt-6 text-sm text-emerald-700">{message}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Core Controls</CardTitle>
          <CardDescription>Operational defaults across announcements, inventory, and auditing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Notification Retention (days)</Label>
            <Input
              type="number"
              min={1}
              max={3650}
              disabled={loading}
              value={form.notificationRetentionDays}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  notificationRetentionDays: Number(event.target.value || 0),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Low Stock Alert Threshold</Label>
            <Input
              type="number"
              min={0}
              max={100000}
              disabled={loading}
              value={form.lowStockAlertThreshold}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  lowStockAlertThreshold: Number(event.target.value || 0),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Medication Suggestions</Label>
            <Select
              value={form.enableMedicationAutoSuggestions ? "enabled" : "disabled"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  enableMedicationAutoSuggestions: value === "enabled",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Audit CSV Export</Label>
            <Select
              value={form.enableAuditCsvExport ? "enabled" : "disabled"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  enableAuditCsvExport: value === "enabled",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Maintenance Mode</Label>
            <Select
              value={form.systemMaintenanceMode ? "enabled" : "disabled"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  systemMaintenanceMode: value === "enabled",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Announcement Audience</CardTitle>
          <CardDescription>
            Choose barangays to preselect when creating admin announcements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            {barangays.map((item) => {
              const selected = form.defaultAnnouncementAudience.includes(item);
              return (
                <Button
                  key={item}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      defaultAnnouncementAudience: selected
                        ? prev.defaultAnnouncementAudience.filter((entry) => entry !== item)
                        : [...prev.defaultAnnouncementAudience, item],
                    }))
                  }
                >
                  {item}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

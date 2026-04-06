"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  is_sensitive: boolean;
}

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [categories, setCategories] = useState<string[]>([]);
  const [editingSettings, setEditingSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const url = selectedCategory
        ? `/api/admin/settings?category=${selectedCategory}`
        : "/api/admin/settings";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setCategories(data.categories);
        // Initialize editing state
        const initial: Record<string, unknown> = {};
        data.settings.forEach((s: SystemSetting) => {
          initial[s.key] = s.value;
        });
        setEditingSettings(initial);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          value: editingSettings[key],
        }),
      });

      if (response.ok) {
        setMessage(`Setting "${key}" updated successfully!`);
        setTimeout(() => setMessage(""), 3000);
        fetchSettings();
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to save setting");
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  };

  const categorySettings = settings.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">Manage application configuration and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.includes("success") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.includes("success") ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-4">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Settings Form */}
      {loading ? (
        <div className="flex justify-center py-8">Loading settings...</div>
      ) : categorySettings.length === 0 ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          No settings found in this category
        </div>
      ) : (
        <div className="space-y-6">
          {categorySettings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-mono text-base">{setting.key}</CardTitle>
                    {setting.description && (
                      <CardDescription>{setting.description}</CardDescription>
                    )}
                  </div>
                  {setting.is_sensitive && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Sensitive
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`setting-${setting.key}`}>Value</Label>
                  <Input
                    id={`setting-${setting.key}`}
                    type={setting.is_sensitive ? "password" : "text"}
                    value={formatValue(editingSettings[setting.key])}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        [setting.key]: e.target.value,
                      })
                    }
                    placeholder="Enter value"
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={saving || formatValue(editingSettings[setting.key]) === formatValue(setting.value)}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MABINI_BARANGAYS_UPPERCASE } from "@/lib/constants/barangays";

type AnnouncementStatus = "draft" | "published";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  poster_image_url?: string | null;
  status: AnnouncementStatus;
  published_at?: string | null;
  created_at: string;
  target_barangays: string[];
}

const ALL_BARANGAYS_OPTION = "__all_barangays__";


const initialForm = {
  title: "",
  content: "",
  posterImageUrl: "",
  targetBarangays: [] as string[],
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeBarangayName(value: string) {
  return value.trim().toUpperCase();
}

function normalizeBarangayList(values: string[]) {
  return Array.from(
    new Set(values.map((value) => normalizeBarangayName(value)).filter(Boolean)),
  );
}

export function AnnouncementManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [barangaySearch, setBarangaySearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [listSearch, setListSearch] = useState("");
  const [listStatus, setListStatus] = useState<"all" | AnnouncementStatus>("all");
  const [listBarangay, setListBarangay] = useState("");

  const isEditing = Boolean(editingId);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.content.trim().length > 0 &&
      form.targetBarangays.length > 0
    );
  }, [form]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [announcementResult, barangayResult] = await Promise.allSettled([
        fetch("/api/announcements"),
        fetch("/api/announcements/barangays"),
      ]);

      let announcementData: { data?: AnnouncementItem[] } = { data: [] };
      let barangayData: { data?: string[] } = { data: [] };

      if (announcementResult.status === "fulfilled") {
        if (announcementResult.value.ok) {
          announcementData = await announcementResult.value.json();
        } else {
          const payload = await announcementResult.value
            .json()
            .catch(() => ({ error: "Failed to fetch announcements" }));
          setError(payload.error || "Failed to fetch announcements");
        }
      } else {
        setError("Failed to fetch announcements");
      }

      if (barangayResult.status === "fulfilled" && barangayResult.value.ok) {
        barangayData = await barangayResult.value.json();
      }

      const mergedBarangays = normalizeBarangayList([
        ...(barangayData.data || []),
        ...MABINI_BARANGAYS_UPPERCASE,
      ]).sort((a, b) => a.localeCompare(b));

      setAnnouncements(announcementData.data || []);
      setBarangays(mergedBarangays);
    } catch (loadError: unknown) {
      setBarangays(MABINI_BARANGAYS_UPPERCASE);
      setError(getErrorMessage(loadError, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedBarangay("");
    setShowBarangayDropdown(false);
    setBarangaySearch("");
    setEditingId(null);
  };

  const handleAddTargetBarangay = (barangaySelection: string) => {
    if (!barangaySelection) {
      return;
    }

    if (barangaySelection === ALL_BARANGAYS_OPTION) {
      setForm((prev) => ({
        ...prev,
        targetBarangays: normalizeBarangayList([
          ...prev.targetBarangays,
          ...barangays,
        ]),
      }));
      setSelectedBarangay("");
      setShowBarangayDropdown(false);
      setBarangaySearch("");
      return;
    }

    setForm((prev) => {
      return {
        ...prev,
        targetBarangays: normalizeBarangayList([
          ...prev.targetBarangays,
          barangaySelection,
        ]),
      };
    });

    setSelectedBarangay("");
    setShowBarangayDropdown(false);
    setBarangaySearch("");
  };

  const handleRemoveTargetBarangay = (barangay: string) => {
    const normalizedBarangay = normalizeBarangayName(barangay);
    setForm((prev) => ({
      ...prev,
      targetBarangays: prev.targetBarangays.filter(
        (item) => normalizeBarangayName(item) !== normalizedBarangay,
      ),
    }));
  };

  const selectedBarangaySet = new Set(
    form.targetBarangays.map((barangay) => normalizeBarangayName(barangay)),
  );

  const availableBarangays = barangays.filter(
    (barangay) => !selectedBarangaySet.has(normalizeBarangayName(barangay)),
  );

  const filteredBarangays = availableBarangays.filter((barangay) =>
    barangay.toLowerCase().includes(barangaySearch.toLowerCase()),
  );

  const filteredAnnouncements = announcements.filter((item) => {
    if (listStatus !== "all" && item.status !== listStatus) {
      return false;
    }

    if (
      listSearch &&
      !`${item.title} ${item.content}`
        .toLowerCase()
        .includes(listSearch.toLowerCase())
    ) {
      return false;
    }

    if (
      listBarangay &&
      !item.target_barangays.some(
        (entry) => normalizeBarangayName(entry) === normalizeBarangayName(listBarangay),
      )
    ) {
      return false;
    }

    return true;
  });

  const announcementSummary = {
    total: announcements.length,
    drafts: announcements.filter((item) => item.status === "draft").length,
    published: announcements.filter((item) => item.status === "published").length,
  };

  const handleEdit = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      posterImageUrl: item.poster_image_url || "",
      targetBarangays: normalizeBarangayList(item.target_barangays || []),
    });
    setMessage("");
    setError("");
  };

  const handlePosterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      event.target.value = "";
      return;
    }

    const maxSizeBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("Image must be 3MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setError("Failed to process the selected image.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        posterImageUrl: result,
      }));
      setError("");
    };

    reader.onerror = () => {
      setError("Failed to process the selected image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = async (status: AnnouncementStatus) => {
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Title, content, and at least one target barangay are required.");
      return;
    }

    setSaving(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? `/api/announcements/${editingId}`
        : "/api/announcements";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save announcement");
      }

      setMessage(editingId ? "Announcement updated." : "Announcement created.");
      resetForm();
      await loadData();
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, "Failed to save announcement"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this announcement?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete announcement");
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage("Announcement deleted.");
      await loadData();
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, "Failed to delete announcement"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (item: AnnouncementItem) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const nextStatus: AnnouncementStatus =
        item.status === "published" ? "draft" : "published";

      const response = await fetch(`/api/announcements/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          posterImageUrl: item.poster_image_url || "",
          status: nextStatus,
          targetBarangays: item.target_barangays,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to update announcement status");
      }

      setMessage(
        nextStatus === "published"
          ? "Announcement published."
          : "Announcement reverted to draft.",
      );
      await loadData();
    } catch (statusError: unknown) {
      setError(getErrorMessage(statusError, "Failed to update announcement status"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Announcements
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Compose and publish targeted announcements to selected barangays.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Announcement" : "Create Announcement"}
          </CardTitle>
          <CardDescription>
            Draft announcements can be updated later. Published announcements are
            visible to targeted barangays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Enter announcement title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                rows={5}
                placeholder="Write announcement details"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Poster Image (Optional)</label>
              <Input type="file" accept="image/*" onChange={handlePosterUpload} />
              <p className="text-xs text-slate-500">
                Upload JPG/PNG/WebP image up to 3MB.
              </p>

              {form.posterImageUrl ? (
                <div className="space-y-2">
                  <Image
                    src={form.posterImageUrl}
                    alt="Announcement poster preview"
                    width={800}
                    height={600}
                    unoptimized
                    className="max-h-64 w-auto rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, posterImageUrl: "" }))
                    }
                  >
                    Remove Poster
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Barangays</label>
              {barangays.length === 0 ? (
                <p className="text-sm text-slate-500">No barangays available.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-950"
                        onClick={() => setShowBarangayDropdown(!showBarangayDropdown)}
                      >
                        {selectedBarangay ? (
                          <div className="flex items-center justify-between">
                            <span>
                              {selectedBarangay === ALL_BARANGAYS_OPTION
                                ? "All Barangays"
                                : selectedBarangay}
                            </span>
                            <X
                              className="h-4 w-4 text-gray-500 cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedBarangay("");
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500">Select a barangay...</span>
                        )}
                      </div>

                      {showBarangayDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 dark:bg-gray-950 dark:border-gray-600">
                          <Input
                            placeholder="Search barangay..."
                            className="m-2 border rounded"
                            value={barangaySearch}
                            onChange={(event) =>
                              setBarangaySearch(event.target.value)
                            }
                            onClick={(event) => event.stopPropagation()}
                          />

                          <div className="max-h-48 overflow-y-auto">
                            {form.targetBarangays.length < barangays.length &&
                              "all barangays"
                                .toLowerCase()
                                .includes(barangaySearch.toLowerCase()) && (
                                <div
                                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedBarangay(ALL_BARANGAYS_OPTION);
                                    handleAddTargetBarangay(ALL_BARANGAYS_OPTION);
                                  }}
                                >
                                  All Barangays
                                </div>
                              )}

                            {filteredBarangays.length > 0 ? (
                              filteredBarangays.map((barangay) => (
                                <div
                                  key={barangay}
                                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedBarangay(barangay);
                                    handleAddTargetBarangay(barangay);
                                  }}
                                >
                                  {barangay}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No barangays found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {form.targetBarangays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {form.targetBarangays.map((barangay) => (
                        <Badge
                          key={barangay}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {barangay}
                          <button
                            type="button"
                            onClick={() => handleRemoveTargetBarangay(barangay)}
                            className="text-slate-500 hover:text-slate-900"
                            aria-label={`Remove ${barangay}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No target barangays selected yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                disabled={saving || !canSubmit}
                onClick={() => handleSave("draft")}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save as Draft"
                    : "Create Draft"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={saving || !canSubmit}
                onClick={() => handleSave("published")}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Publish Update"
                    : "Publish"}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcement List</CardTitle>
          <CardDescription>
            Manage posted drafts and published announcements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{announcementSummary.total}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Published</p>
              <p className="text-2xl font-bold text-emerald-700">{announcementSummary.published}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Drafts</p>
              <p className="text-2xl font-bold text-amber-700">{announcementSummary.drafts}</p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Input
              value={listSearch}
              placeholder="Search title or content"
              onChange={(event) => setListSearch(event.target.value)}
            />

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={listStatus}
              onChange={(event) =>
                setListStatus(event.target.value as "all" | AnnouncementStatus)
              }
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={listBarangay || "__all"}
              onChange={(event) =>
                setListBarangay(event.target.value === "__all" ? "" : event.target.value)
              }
            >
              <option value="__all">All Barangays</option>
              {barangays.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading announcements...</p>
          ) : filteredAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4 space-y-3 bg-white dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <Badge
                      className={
                        item.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {item.poster_image_url ? (
                    <Image
                      src={item.poster_image_url}
                      alt={`${item.title} poster`}
                      width={900}
                      height={700}
                      unoptimized
                      className="max-h-72 w-auto rounded-md border"
                    />
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {item.target_barangays.map((barangay) => (
                      <Badge key={`${item.id}-${barangay}`} variant="outline">
                        {barangay}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Created {format(new Date(item.created_at), "PPP p")}
                    {item.published_at
                      ? ` • Published ${format(new Date(item.published_at), "PPP p")}`
                      : ""}
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(item)}
                      disabled={saving}
                    >
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

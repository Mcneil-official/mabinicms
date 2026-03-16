"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarangayProfileForm } from "@/components/barangay-profiling/barangay-profile-form";
import { BarangayProfilesList } from "@/components/barangay-profiling/barangay-profiles-list";
import { ViewProfileDialog } from "@/components/barangay-profiling/view-profile-dialog";
import type { BarangayProfileFormData } from "@/components/barangay-profiling/barangay-profile-form";
import type { BarangayProfile } from "@/components/barangay-profiling/barangay-profiles-list";
import { getBarangayProfiles } from "@/lib/queries/barangay-profiles";
import {
  createBarangayProfileAction,
  updateBarangayProfileAction,
  deleteBarangayProfileAction,
} from "@/lib/actions/barangay-profiles";
import { BookUser, AlertCircle } from "lucide-react";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BarangayProfilingPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<BarangayProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BarangayProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<BarangayProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Load profiles ──────────────────────────────────────────────────────────

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const result = await getBarangayProfiles({ limit: 200 });
      if (result.error) {
        setPageError("Failed to load profiles. Please try again.");
      } else {
        setProfiles(result.data);
      }
    } catch {
      setPageError("Failed to load profiles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingProfile(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (profile: BarangayProfile) => {
    setEditingProfile(profile);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleView = (profile: BarangayProfile) => {
    setViewingProfile(profile);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const result = await deleteBarangayProfileAction(deletingId);
    if (result.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== deletingId));
    } else {
      setPageError(result.error ?? "Failed to delete profile.");
    }
    setDeletingId(null);
  };

  const handleFormSubmit = async (data: BarangayProfileFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingProfile) {
        const result = await updateBarangayProfileAction(editingProfile.id, data);
        if (!result.success) {
          setFormError(result.error ?? "Failed to update profile.");
          return;
        }
      } else {
        const result = await createBarangayProfileAction(data);
        if (!result.success) {
          setFormError(result.error ?? "Failed to save profile.");
          return;
        }
      }
      await loadProfiles();
      setIsFormOpen(false);
      setEditingProfile(null);
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
    setFormError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
          <BookUser className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Barangay & Pregnancy Profiling
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage merged barangay profiling, pregnancy details, and health histories
          </p>
        </div>
      </div>

      {/* Page-level error */}
      {pageError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      {/* Profiles List */}
      <BarangayProfilesList
        profiles={profiles}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDeleteRequest}
      />

      {/* Add / Edit Form Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(v) => {
          if (!v) handleFormCancel();
        }}
      >
        <DialogContent className="w-[95vw] lg:w-[90vw] max-w-6xl sm:max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Edit Barangay Profile" : "New Barangay Profile"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <BarangayProfileForm
            key={editingProfile?.id ?? "new"}
            initialData={editingProfile ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            mode={editingProfile ? "edit" : "create"}
          />
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <ViewProfileDialog
        profile={viewingProfile}
        open={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The profile will be permanently
              removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

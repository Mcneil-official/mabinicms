"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface Facility {
  id: string;
  name: string;
}

interface DeleteFacilityDialogProps {
  facility: Facility;
  onDelete: () => void;
  onClose: () => void;
}

export default function DeleteFacilityDialog({
  facility,
  onDelete,
  onClose,
}: DeleteFacilityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/facilities/${facility.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete facility");
      }

      onDelete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Deactivate Facility
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate <strong>{facility.name}</strong>? The facility
            will be hidden from active operations but can be audited later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (optional)"
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading ? "Deactivating..." : "Deactivate Facility"}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

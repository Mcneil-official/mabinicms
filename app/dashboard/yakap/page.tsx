"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getYakakApplications } from "@/lib/queries/yakap";
import { getResidents } from "@/lib/queries/residents";
import { YakakForm, type YakakFormData } from "@/components/yakap/yakap-form";
import { YakakApplicationsList } from "@/components/yakap/yakap-applications-list";
import { createYakakAction } from "@/lib/actions/yakap";
import type { Resident, User, Session } from "@/lib/types";

interface PageState {
  applications: any[];
  residents: Resident[];
  isLoading: boolean;
  isLoadingResidents: boolean;
  selectedApplication?: any;
  isDialogOpen?: boolean;
  session: Session | null;
}

export default function YakakPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    applications: [],
    residents: [],
    isLoading: true,
    isLoadingResidents: true,
    session: null,
  });

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    console.log("[yakap-page] Fetching applications...");
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const session = await getSession();
      setState((prev) => ({ ...prev, session }));
      console.log("[yakap-page] Session:", session);

      if (!session) {
        console.warn("[yakap-page] No session found");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Call without barangay filter - let admins see all, others see all by default
      console.log(
        "[yakap-page] Calling getYakakApplications, user role:",
        session.user.role,
      );
      const result = await getYakakApplications(
        undefined, // Don't filter by barangay
        session.user.role === "admin",
        {
          limit: 100,
        },
      );

      console.log("[yakap-page] Result:", result);
      setState((prev) => ({
        ...prev,
        applications: result.data || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error("[fetchApplications]", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch residents
  const fetchResidents = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingResidents: true }));

    try {
      const session = await getSession();
      if (!session) {
        setState((prev) => ({ ...prev, isLoadingResidents: false }));
        return;
      }

      if (!session.user.assigned_barangay) {
        // Skip loading residents if no barangay assigned
        setState((prev) => ({ ...prev, isLoadingResidents: false }));
        return;
      }

      const result = await getResidents({
        barangay: session.user.assigned_barangay,
        limit: 100,
      });

      setState((prev) => ({
        ...prev,
        residents: result.data || [],
        isLoadingResidents: false,
      }));
    } catch (error) {
      console.error("[fetchResidents]", error);
      setState((prev) => ({ ...prev, isLoadingResidents: false }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchApplications();
    fetchResidents();
  }, [fetchApplications, fetchResidents]);

  const handleCloseDialog = () => {
    setState((prev) => ({
      ...prev,
      isDialogOpen: false,
      selectedApplication: undefined,
    }));
  };

  const handleApprovalChange = () => {
    fetchApplications(); // Refresh list after approval/return
  };

  const handleFormSubmit = async (formData: YakakFormData) => {
    const result = await createYakakAction(formData);
    if (!result.success) {
      throw new Error(result.error || "Failed to submit application");
    }
    fetchApplications(); // Refresh applications list after submission
  };

  const handleFormSuccess = () => {
    fetchApplications(); // Refresh applications list after successful submission
  };

  const isStaff =
    state.session?.user?.role === "staff" ||
    state.session?.user?.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          YAKAP Application Form
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Submit resident information for YAKAP (Kalusugan Para sa Lahat) health
          insurance coverage.
        </p>
      </div>

      {/* YAKAP Application Form */}
      <YakakForm
        residents={state.residents}
        isLoading={state.isLoadingResidents}
        onSubmit={handleFormSubmit}
        onSuccess={handleFormSuccess}
      />

      {/* YAKAP Applications List - Shows submitted applications */}
      <YakakApplicationsList
        applications={state.applications}
        isLoading={state.isLoading}
        isStaff={isStaff}
        onStatusUpdated={fetchApplications}
      />
    </div>
  );
}

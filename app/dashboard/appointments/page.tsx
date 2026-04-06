"use client";

import { useState, useCallback, useEffect } from "react";
import { getSession } from "@/lib/auth";
import { getAppointments } from "@/lib/queries/appointments";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import type { AppointmentWithDetails } from "@/lib/queries/appointments";
import type { Session } from "@/lib/types";

interface PageState {
  appointments: AppointmentWithDetails[];
  isLoading: boolean;
  selectedStatus: string;
  selectedDate: string; // YYYY-MM-DD format or empty for all dates
  session: Session | null;
}

export default function AppointmentsPage() {
  const [state, setState] = useState<PageState>({
    appointments: [],
    isLoading: true,
    selectedStatus: "all",
    selectedDate: "",
    session: null,
  });

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const session = await getSession();
      setState((prev) => ({ ...prev, session }));

      if (!session) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const { data } = await getAppointments({
        status:
          state.selectedStatus === "all" ? undefined : state.selectedStatus,
        date: state.selectedDate || undefined,
        limit: 50,
      });

      setState((prev) => ({
        ...prev,
        appointments: data,
        isLoading: false,
      }));
    } catch (error) {
      console.error("[fetchAppointments]", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedStatus, state.selectedDate]);

  // Initial load
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = (status: string) => {
    setState((prev) => ({ ...prev, selectedStatus: status }));
  };

  const isStaff =
    state.session?.user?.role === "admin" ||
    state.session?.user?.role === "staff";

  const bookedCount = state.appointments.filter(
    (a) => a.status === "booked",
  ).length;
  const completedCount = state.appointments.filter(
    (a) => a.status === "completed",
  ).length;
  const cancelledCount = state.appointments.filter(
    (a) => a.status === "cancelled",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Health Facility Appointments
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View and manage all booked appointments at health facilities
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Appointments
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {state.appointments.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Booked
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {bookedCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Completed
          </p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {completedCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {cancelledCount}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {["all", "booked", "completed", "cancelled", "no_show"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    state.selectedStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {status === "no_show"
                    ? "No Show"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Filter by date:
            </label>
            <input
              type="date"
              value={state.selectedDate}
              onChange={(e) =>
                setState((prev) => ({ ...prev, selectedDate: e.target.value }))
              }
              className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state.selectedDate && (
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, selectedDate: "" }))
                }
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <AppointmentsTable
        appointments={state.appointments}
        isLoading={state.isLoading}
        isStaff={isStaff}
        onStatusUpdated={fetchAppointments}
      />
    </div>
  );
}

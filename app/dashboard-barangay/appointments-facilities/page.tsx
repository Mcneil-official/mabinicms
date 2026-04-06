"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAppointments } from "@/lib/queries/appointments";
import { getFacilities } from "@/lib/queries/services";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { FacilitiesGrid } from "@/components/facilities/facilities-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppointmentWithDetails } from "@/lib/queries/appointments";

interface HealthFacility {
  id: string;
  name: string;
  barangay: string;
  address: string;
  operating_hours?: string;
  contact_json?: Array<{ name?: string; role?: string; phone?: string }>;
  general_services?: string;
  specialized_services?: string;
  service_capability?: string;
  yakap_accredited?: boolean;
}

interface PageState {
  appointments: AppointmentWithDetails[];
  facilities: HealthFacility[];
  appointmentsLoading: boolean;
  facilitiesLoading: boolean;
  selectedStatus: string;
  selectedDate: string;
  selectedFacility: HealthFacility | null;
}

export default function AppointmentsFacilitiesPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    appointments: [],
    facilities: [],
    appointmentsLoading: true,
    facilitiesLoading: true,
    selectedStatus: "all",
    selectedDate: "",
    selectedFacility: null,
  });

  const checkStaffAccess = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      router.replace("/auth/login");
      return false;
    }

    if ((session.user.role || "").trim().toLowerCase() !== "staff") {
      router.replace("/dashboard-barangay");
      return false;
    }

    return true;
  }, [router]);

  const fetchAppointments = useCallback(async () => {
    setState((prev) => ({ ...prev, appointmentsLoading: true }));

    try {
      const isAllowed = await checkStaffAccess();
      if (!isAllowed) {
        setState((prev) => ({ ...prev, appointmentsLoading: false }));
        return;
      }

      const { data } = await getAppointments({
        status: state.selectedStatus === "all" ? undefined : state.selectedStatus,
        date: state.selectedDate || undefined,
        limit: 50,
      });

      setState((prev) => ({
        ...prev,
        appointments: data,
        appointmentsLoading: false,
      }));
    } catch (error) {
      console.error("[fetchAppointmentsCombined]", error);
      setState((prev) => ({ ...prev, appointmentsLoading: false }));
    }
  }, [checkStaffAccess, state.selectedDate, state.selectedStatus]);

  const fetchFacilities = useCallback(async () => {
    setState((prev) => ({ ...prev, facilitiesLoading: true }));

    try {
      const isAllowed = await checkStaffAccess();
      if (!isAllowed) {
        setState((prev) => ({ ...prev, facilitiesLoading: false }));
        return;
      }

      const facilities = (await getFacilities()) as HealthFacility[];
      setState((prev) => ({
        ...prev,
        facilities,
        facilitiesLoading: false,
      }));
    } catch (error) {
      console.error("[fetchFacilitiesCombined]", error);
      setState((prev) => ({ ...prev, facilitiesLoading: false }));
    }
  }, [checkStaffAccess]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacilities();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchFacilities]);

  const appointmentStats = useMemo(() => {
    const booked = state.appointments.filter((a) => a.status === "booked").length;
    const completed = state.appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const cancelled = state.appointments.filter(
      (a) => a.status === "cancelled",
    ).length;

    return {
      total: state.appointments.length,
      booked,
      completed,
      cancelled,
    };
  }, [state.appointments]);

  const handleStatusChange = (status: string) => {
    setState((prev) => ({ ...prev, selectedStatus: status }));
  };

  const handleViewDetails = (id: string) => {
    const facility = state.facilities.find((f) => f.id === id);
    if (facility) {
      setState((prev) => ({ ...prev, selectedFacility: facility }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Appointments & Facilities
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Combined view of appointment activity and health facility references.
        </p>
      </div>
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Appointments
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Monitor bookings and appointment outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Appointments
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {appointmentStats.total}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Booked</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {appointmentStats.booked}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {appointmentStats.completed}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Cancelled
              </p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                {appointmentStats.cancelled}
              </p>
            </div>
          </div>

          <div className="sticky top-4 z-20 rounded-lg border border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {["all", "booked", "completed", "cancelled", "no_show"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      state.selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {status === "no_show"
                      ? "No Show"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Filter by date:
                </label>
                <input
                  type="date"
                  value={state.selectedDate}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, selectedDate: event.target.value }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                {state.selectedDate && (
                  <button
                    onClick={() => setState((prev) => ({ ...prev, selectedDate: "" }))}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <AppointmentsTable
            appointments={state.appointments}
            isLoading={state.appointmentsLoading}
            isStaff={false}
            onStatusUpdated={fetchAppointments}
          />
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Facilities
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Browse available health facilities and contact details.
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {state.facilities.length} facilities available
          </p>

          <FacilitiesGrid
            facilities={state.facilities}
            isLoading={state.facilitiesLoading}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!state.selectedFacility}
        onOpenChange={(open) => {
          if (!open) {
            setState((prev) => ({ ...prev, selectedFacility: null }));
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {state.selectedFacility && (
            <>
              <DialogHeader>
                <div>
                  <DialogTitle className="text-2xl">
                    {state.selectedFacility.name}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {state.selectedFacility.barangay}
                  </p>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {state.selectedFacility.address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Address
                    </p>
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                      {state.selectedFacility.address}
                    </p>
                  </div>
                )}

                {state.selectedFacility.operating_hours && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Operating Hours
                    </p>
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                      {state.selectedFacility.operating_hours}
                    </p>
                  </div>
                )}

                {state.selectedFacility.contact_json &&
                  Array.isArray(state.selectedFacility.contact_json) &&
                  state.selectedFacility.contact_json.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Staff Contacts
                      </p>
                      <div className="mt-2 space-y-2">
                        {state.selectedFacility.contact_json.map((contact, index) => (
                          <div
                            key={index}
                            className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <p className="font-medium text-slate-900 dark:text-white">
                              {contact.name}
                            </p>
                            {contact.role && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {contact.role}
                              </p>
                            )}
                            {contact.phone && (
                              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {(state.selectedFacility.general_services ||
                  state.selectedFacility.specialized_services) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Services
                    </p>
                    <div className="mt-2 space-y-1">
                      {state.selectedFacility.general_services && (
                        <p className="text-slate-700 dark:text-slate-300">
                          • {state.selectedFacility.general_services}
                        </p>
                      )}
                      {state.selectedFacility.specialized_services && (
                        <p className="text-slate-700 dark:text-slate-300">
                          • {state.selectedFacility.specialized_services}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

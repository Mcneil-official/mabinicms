"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface WorkerRow {
  id: string;
  username: string;
  role: string;
  assigned_barangay?: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

interface WorkerActivity {
  id: string;
  action: string;
  resource_type: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface WorkerApiPayload {
  workers: WorkerRow[];
  summary: {
    totalWorkers: number;
    activeWorkers: number;
    inactiveWorkers: number;
    uniqueBarangays: number;
  };
  recentActivity: WorkerActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function WorkerOperationsModule() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [activities, setActivities] = useState<WorkerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [barangay, setBarangay] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    inactiveWorkers: 0,
    uniqueBarangays: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [barangays, setBarangays] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        status,
        barangay,
      });

      const [workerResponse, barangayResponse] = await Promise.all([
        fetch(`/api/admin/worker-operations?${params.toString()}`),
        fetch("/api/admin/barangays"),
      ]);

      const workerPayload = (await workerResponse.json()) as WorkerApiPayload & { error?: string };
      if (!workerResponse.ok) {
        throw new Error(workerPayload.error || "Failed to load worker operations");
      }

      setWorkers(workerPayload.workers || []);
      setActivities(workerPayload.recentActivity || []);
      setSummary(workerPayload.summary);
      setPagination(workerPayload.pagination);

      if (barangayResponse.ok) {
        const barangayPayload = (await barangayResponse.json()) as { data: string[] };
        setBarangays(barangayPayload.data || []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load worker operations");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, barangay]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activityByWorker = useMemo(() => {
    const map = new Map<string, number>();
    for (const activity of activities) {
      map.set(activity.user_id, (map.get(activity.user_id) || 0) + 1);
    }
    return map;
  }, [activities]);

  const handleToggleStatus = async (worker: WorkerRow) => {
    setSavingId(worker.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${worker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !worker.is_active }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update worker status");
      }

      setMessage(`Worker ${worker.username} is now ${worker.is_active ? "inactive" : "active"}.`);
      await fetchData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update worker status");
    } finally {
      setSavingId(null);
    }
  };

  const handleReassignBarangay = async (workerId: string, nextBarangay: string) => {
    setSavingId(workerId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_barangay: nextBarangay || null }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to reassign worker barangay");
      }

      setMessage("Worker barangay updated.");
      await fetchData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to reassign worker");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Worker Operations Management</h1>
        <p className="text-muted-foreground">
          Manage worker availability, assignment, and activity visibility across barangays.
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{summary.totalWorkers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-emerald-700">{summary.activeWorkers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-rose-700">{summary.inactiveWorkers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Assigned Barangays</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{summary.uniqueBarangays}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Filters</CardTitle>
          <CardDescription>Quickly segment workers by status, barangay, or name.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input
            value={search}
            placeholder="Search username"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={barangay || "__all"}
            onValueChange={(value) => {
              setBarangay(value === "__all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Barangay" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Barangays</SelectItem>
              {barangays.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workers</CardTitle>
          <CardDescription>Inline controls for worker assignment and activation state.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading workers...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Barangay</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Recent Actions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.username}</TableCell>
                    <TableCell>
                      <Badge variant={worker.is_active ? "outline" : "destructive"}>
                        {worker.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={worker.assigned_barangay || "__none"}
                        onValueChange={(value) =>
                          handleReassignBarangay(
                            worker.id,
                            value === "__none" ? "" : value
                          )
                        }
                        disabled={savingId === worker.id}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Assign barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Unassigned</SelectItem>
                          {barangays.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatDate(worker.last_login_at)}</TableCell>
                    <TableCell>{activityByWorker.get(worker.id) || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant={worker.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(worker)}
                        disabled={savingId === worker.id}
                      >
                        {savingId === worker.id
                          ? "Saving..."
                          : worker.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No workers found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}

          {pagination.pages > 1 ? (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Worker Activity</CardTitle>
          <CardDescription>Latest worker-related audit events for operations monitoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent worker activity.</p>
          ) : (
            activities.slice(0, 20).map((activity) => (
              <div key={activity.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {activity.action} - {activity.resource_type}
                </p>
                <p className="text-muted-foreground">
                  Status: {activity.status} - {formatDate(activity.created_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

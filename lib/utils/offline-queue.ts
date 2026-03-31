"use client";

import type { OfflineQueueItem } from "@/lib/types";

/**
 * Offline Queue Manager
 * Stores health worker data locally when offline
 * Syncs with Supabase when connection is restored
 */

const QUEUE_KEY = "mabinicare_offline_queue";
const SYNC_STATUS_KEY = "mabinicare_sync_status";

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  errors: Array<{
    timestamp: number;
    message: string;
    recordId: string;
  }>;
}

/**
 * Add item to offline queue
 */
export function addToQueue(
  type: "vaccination" | "maternal_health" | "senior_assistance",
  data: any,
): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data: {
      ...data,
      synced: false,
    },
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    const queue = getQueue();
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // Update sync status
    updateSyncStatus();

    return item;
  } catch (error) {
    console.error("Error adding to queue:", error);
    throw error;
  }
}

/**
 * Get all queued items
 */
export function getQueue(): OfflineQueueItem[] {
  try {
    const queueStr = localStorage.getItem(QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error("Error reading queue:", error);
    return [];
  }
}

/**
 * Remove item from queue once synced
 */
export function removeFromQueue(itemId: string): void {
  try {
    const queue = getQueue();
    const filtered = queue.filter((item) => item.id !== itemId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    updateSyncStatus();
  } catch (error) {
    console.error("Error removing from queue:", error);
  }
}

/**
 * Update retry count and add error
 */
export function updateQueueItemError(itemId: string, error: string): void {
  try {
    const queue = getQueue();
    const item = queue.find((i) => i.id === itemId);

    if (item) {
      item.retryCount += 1;
      item.lastError = error;

      // Remove after 3 failed attempts (for user to fix manually)
      if (item.retryCount >= 3) {
        removeFromQueue(itemId);
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    }

    updateSyncStatus();
  } catch (error) {
    console.error("Error updating queue item:", error);
  }
}

/**
 * Clear entire queue (admin function)
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
    updateSyncStatus();
  } catch (error) {
    console.error("Error clearing queue:", error);
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): SyncStatus {
  try {
    const statusStr = localStorage.getItem(SYNC_STATUS_KEY);
    const status = statusStr
      ? JSON.parse(statusStr)
      : {
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          errors: [],
        };

    // Add current pending count
    status.pendingCount = getQueue().length;

    return status;
  } catch (error) {
    console.error("Error reading sync status:", error);
    return {
      isSyncing: false,
      lastSyncTime: null,
      pendingCount: 0,
      errors: [],
    };
  }
}

/**
 * Update sync status
 */
export function updateSyncStatus(partial?: Partial<SyncStatus>): void {
  try {
    const current = getSyncStatus();
    const status: SyncStatus = {
      ...current,
      ...partial,
      pendingCount: getQueue().length,
    };

    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error("Error updating sync status:", error);
  }
}

/**
 * Set syncing status
 */
export function setSyncing(isSyncing: boolean): void {
  updateSyncStatus({
    isSyncing,
    lastSyncTime: isSyncing ? null : Date.now(),
  });
}

/**
 * Add error to sync status
 */
export function addSyncError(recordId: string, message: string): void {
  try {
    const status = getSyncStatus();
    status.errors.push({
      timestamp: Date.now(),
      message,
      recordId,
    });

    // Keep only last 20 errors
    if (status.errors.length > 20) {
      status.errors = status.errors.slice(-20);
    }

    updateSyncStatus(status);
  } catch (error) {
    console.error("Error adding sync error:", error);
  }
}

/**
 * Clear sync errors
 */
export function clearSyncErrors(): void {
  try {
    const status = getSyncStatus();
    status.errors = [];
    updateSyncStatus(status);
  } catch (error) {
    console.error("Error clearing sync errors:", error);
  }
}

/**
 * Check if offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listen for online/offline status changes
 */
export function setupOfflineListener(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  const handleOnline = () => {
    console.log("Device is online");
    onOnline();
  };

  const handleOffline = () => {
    console.log("Device is offline");
    onOffline();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Hook to check if online
 * Usage: const isOnline = useOnlineStatus();
 */
export function useOnlineStatus(): boolean {
  if (typeof window === "undefined") return true;

  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Export queue to CSV for backup
 */
export function exportQueueAsCSV(): string {
  const queue = getQueue();
  const headers = [
    "ID",
    "Type",
    "Resident ID",
    "Timestamp",
    "Retry Count",
    "Status",
  ];

  const rows = queue.map((item) => [
    item.id,
    item.type,
    item.data.resident_id || "",
    new Date(item.timestamp).toISOString(),
    item.retryCount,
    item.lastError ? "Error" : "Pending",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csv;
}

/**
 * Download queue as CSV file
 */
export function downloadQueueBackup(): void {
  const csv = exportQueueAsCSV();
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURI(csv));
  element.setAttribute("download", `mabinicare-queue-${Date.now()}.csv`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Import React for the hook
import React from "react";
/**
 * Get queue statistics for sync status display
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
}> {
  const queue = getQueue();
  const status = getSyncStatus();
  const failed = queue.filter(
    (item) => item.retryCount > 0 && item.lastError,
  ).length;
  const pending = queue.length - failed;
  return {
    total: queue.length,
    pending,
    syncing: status.isSyncing ? 1 : 0,
    synced: 0,
    failed,
  };
}

/**
 * Sync all queued items with the server
 */
export async function syncQueue(
  baseUrl: string,
  authToken: string,
): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  let synced = 0;
  let failed = 0;

  setSyncing(true);

  for (const item of queue) {
    try {
      let endpoint = "";
      if (item.type === "vaccination") {
        endpoint = `${baseUrl}/api/health-workers/vaccination-records`;
      } else if (item.type === "maternal_health") {
        endpoint = `${baseUrl}/api/health-workers/maternal-health-records`;
      } else if (item.type === "senior_assistance") {
        endpoint = `${baseUrl}/api/health-workers/senior-assistance-records`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        removeFromQueue(item.id);
        synced++;
      } else {
        updateQueueItemError(item.id, `HTTP ${response.status}`);
        failed++;
      }
    } catch (error) {
      updateQueueItemError(item.id, String(error));
      failed++;
    }
  }

  setSyncing(false);
  return { synced, failed };
}

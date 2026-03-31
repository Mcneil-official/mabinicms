"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ScanLine, ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertScanLog } from "@/lib/services/scanLogService";
import type { MabiniCareQRPayload } from "@/lib/types";

// Dynamically import the scanner (camera access) to avoid SSR issues
const QRScanner = dynamic(
  () =>
    import("@/components/qr-scanner/qr-scanner").then((m) => m.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    ),
  },
);

export default function ScannerPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (payload: MabiniCareQRPayload) => {
      if (processing) return; // debounce duplicate decodes
      setProcessing(true);
      setError(null);

      try {
        // Insert audit log
        const { error: logError } = await insertScanLog({
          resident_id: payload.id,
          device_info: navigator.userAgent,
        });

        if (logError) {
          console.warn("[ScannerPage] scan log insert failed:", logError);
          // Non-fatal — still show the profile
        }

        // Navigate to resident profile
        router.push(
          `/dashboard-workers/scanner/resident/${payload.id}`,
        );
      } catch (err) {
        console.error("[ScannerPage] handleScan error:", err);
        setError("Something went wrong while loading the resident profile.");
        setProcessing(false);
      }
    },
    [processing, router],
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <ScanLine className="h-6 w-6 text-emerald-500" />
          QR Health ID Scanner
        </h1>
        <p className="text-sm text-slate-500">
          Scan a resident&apos;s MabiniCare QR code to view their full health
          profile.
        </p>
      </div>

      {/* Auth notice */}
      <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
        <ShieldAlert className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800 dark:text-emerald-200 text-xs">
          Access to resident health records is logged. Unauthorized access is
          prohibited.
        </AlertDescription>
      </Alert>

      {/* Scanner card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Camera Scanner</CardTitle>
          <CardDescription>
            Position the QR code inside the frame. Allow camera access when
            prompted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processing ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-500">Loading resident profile…</p>
            </div>
          ) : (
            <QRScanner onScan={handleScan} />
          )}

          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

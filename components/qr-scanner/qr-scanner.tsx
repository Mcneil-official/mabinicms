"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { MabiniCareQRPayload } from "@/lib/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validatePayload(raw: string): MabiniCareQRPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed?.type !== "mabinicare_resident" ||
      parsed?.v !== 1 ||
      typeof parsed?.id !== "string" ||
      !UUID_REGEX.test(parsed.id)
    ) {
      return null;
    }
    return parsed as MabiniCareQRPayload;
  } catch {
    return null;
  }
}

interface QRScannerProps {
  onScan: (payload: MabiniCareQRPayload) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerId = "qr-reader-container";

  useEffect(() => {
    let instance: any;

    async function initScanner() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      instance = new Html5QrcodeScanner(
        containerId,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false,
      );

      instance.render(
        (decodedText: string) => {
          setScanError(null);
          const payload = validatePayload(decodedText);
          if (!payload) {
            setScanError(
              "Invalid or unrecognized QR code. This is not a MabiniCare Health ID.",
            );
            return;
          }
          onScan(payload);
        },
        () => {
          // per-frame errors are normal – ignore
        },
      );

      scannerRef.current = instance;
      setLoading(false);
    }

    initScanner().catch((err) => {
      console.error("[QRScanner] init error:", err);
      setScanError("Unable to start camera. Please allow camera access.");
      setLoading(false);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {/* ignore cleanup errors */});
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4">
      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Starting camera...</span>
        </div>
      )}

      {/* html5-qrcode mounts its UI here */}
      <div id={containerId} className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 shadow-sm" />

      {scanError && (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      )}

      {!loading && (
        <p className="text-center text-xs text-slate-500">
          Point the camera at a resident&apos;s MabiniCare QR code.
        </p>
      )}
    </div>
  );
}

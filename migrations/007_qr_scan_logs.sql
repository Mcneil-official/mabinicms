-- Migration: QR Scan Activity Log
-- Feature: MabiniCare QR Scanner — audit every scan made by health workers

-- ============================================================
-- TABLE: qr_scan_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id  UUID        NOT NULL REFERENCES residents(id),
  scanned_by   UUID        NOT NULL REFERENCES users(id),
  scanned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  facility_id  UUID        REFERENCES health_facilities(id),
  device_info  TEXT,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_resident_id  ON qr_scan_logs (resident_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_by   ON qr_scan_logs (scanned_by);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_at   ON qr_scan_logs (scanned_at DESC);

-- RLS is disabled — access is controlled at the application layer.
ALTER TABLE qr_scan_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Barangay Vaccination Coverage - Database Schema & Migration
-- ============================================================================
-- This SQL schema creates tables to store and calculate vaccination coverage
-- data aggregated by barangay, supporting the GIS map visualization feature.

-- ============================================================================
-- TABLE: vaccination_records
-- Purpose: Core vaccination records for individual residents
-- ============================================================================
CREATE TABLE IF NOT EXISTS vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  vaccine_type VARCHAR(100) NOT NULL,
  dose_number INTEGER NOT NULL,
  vaccination_date DATE NOT NULL,
  vaccinator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_vaccination UNIQUE (resident_id, vaccine_type, dose_number)
);

CREATE INDEX idx_vaccination_barangay ON vaccination_records(barangay);
CREATE INDEX idx_vaccination_date ON vaccination_records(vaccination_date);
CREATE INDEX idx_vaccination_resident ON vaccination_records(resident_id);

-- ============================================================================
-- TABLE: health_interventions
-- Purpose: Track pending and completed health interventions by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  intervention_type VARCHAR(100) NOT NULL, -- vaccination, maternal_care, senior_care, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, critical
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intervention_barangay ON health_interventions(barangay);
CREATE INDEX idx_intervention_status ON health_interventions(status);
CREATE INDEX idx_intervention_resident ON health_interventions(resident_id);

-- ============================================================================
-- TABLE: maternal_health_visits
-- Purpose: Track maternal health visits and prenatal care by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS maternal_health_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  visit_type VARCHAR(100) NOT NULL, -- prenatal, postnatal, screening, etc.
  visit_date DATE NOT NULL,
  health_worker_id UUID REFERENCES users(id),
  findings TEXT,
  referral_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maternal_barangay ON maternal_health_visits(barangay);
CREATE INDEX idx_maternal_visit_date ON maternal_health_visits(visit_date);

-- ============================================================================
-- TABLE: senior_citizen_assistance
-- Purpose: Track assisted senior citizens and their care records by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS senior_citizen_assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  assistance_type VARCHAR(100) NOT NULL, -- medical, nutritional, social, etc.
  assistance_date DATE NOT NULL,
  health_worker_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_senior_barangay ON senior_citizen_assistance(barangay);
CREATE INDEX idx_senior_assistance_date ON senior_citizen_assistance(assistance_date);

-- ============================================================================
-- VIEW: barangay_vaccination_summary
-- Purpose: Aggregated vaccination coverage statistics by barangay
-- This view is used by the GIS map component to display coverage data
-- ============================================================================
CREATE OR REPLACE VIEW barangay_vaccination_summary AS
SELECT
  r.barangay AS barangay_name,
  COUNT(DISTINCT r.id) AS total_residents,
  COUNT(DISTINCT CASE 
    WHEN vr.resident_id IS NOT NULL THEN vr.resident_id 
  END) AS vaccinated_residents,
  ROUND(
    (COUNT(DISTINCT CASE WHEN vr.resident_id IS NOT NULL THEN vr.resident_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT r.id)::NUMERIC, 0) * 100)::NUMERIC, 
    2
  ) AS vaccination_coverage_percentage,
  COUNT(DISTINCT CASE 
    WHEN hi.status = 'pending' THEN hi.id 
  END) AS pending_interventions_count,
  COUNT(DISTINCT CASE 
    WHEN mhv.resident_id IS NOT NULL THEN mhv.resident_id 
  END) AS maternal_health_visits_count,
  COUNT(DISTINCT CASE 
    WHEN sca.resident_id IS NOT NULL THEN sca.resident_id 
  END) AS senior_citizens_assisted_count,
  MAX(GREATEST(
    (SELECT MAX(vaccination_date) FROM vaccination_records WHERE barangay = r.barangay),
    (SELECT MAX(visit_date) FROM maternal_health_visits WHERE barangay = r.barangay),
    (SELECT MAX(assistance_date) FROM senior_citizen_assistance WHERE barangay = r.barangay),
    NOW() - INTERVAL '30 days'
  )) AS last_updated_at
FROM residents r
LEFT JOIN vaccination_records vr ON r.id = vr.resident_id 
  AND vr.vaccination_date <= CURRENT_DATE
LEFT JOIN health_interventions hi ON r.id = hi.resident_id 
  AND hi.barangay = r.barangay
LEFT JOIN maternal_health_visits mhv ON r.id = mhv.resident_id 
  AND mhv.barangay = r.barangay
  AND mhv.visit_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN senior_citizen_assistance sca ON r.id = sca.resident_id 
  AND sca.barangay = r.barangay
  AND sca.assistance_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.barangay
ORDER BY barangay_name;

-- ============================================================================
-- VIEW: barangay_health_status
-- Purpose: Health status indicators by barangay (for dashboard alerts)
-- ============================================================================
CREATE OR REPLACE VIEW barangay_health_status AS
SELECT
  barangay_name,
  vaccination_coverage_percentage,
  pending_interventions_count,
  total_residents,
  CASE
    WHEN vaccination_coverage_percentage < 50 OR pending_interventions_count > 10 
      THEN 'critical'
    WHEN vaccination_coverage_percentage < 70 OR pending_interventions_count > 5 
      THEN 'warning'
    ELSE 'good'
  END AS health_status,
  ROUND(
    (vaccination_coverage_percentage * 0.7 + 
     GREATEST(0, 100 - (pending_interventions_count::NUMERIC / NULLIF(total_residents, 0) * 100)) * 0.3)
    , 2
  ) AS health_score
FROM barangay_vaccination_summary;

-- ============================================================================
-- FUNCTION: update_vaccination_coverage()
-- Purpose: Refresh vaccination coverage metrics after vaccination records
-- ============================================================================
CREATE OR REPLACE FUNCTION update_vaccination_coverage()
RETURNS TRIGGER AS $$
BEGIN
  -- The view will automatically reflect changes since it queries the base tables
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_update_vaccination_metrics
-- Purpose: Track changes to vaccination records
-- ============================================================================
CREATE TRIGGER trigger_update_vaccination_metrics
AFTER INSERT OR UPDATE OR DELETE ON vaccination_records
FOR EACH ROW
EXECUTE FUNCTION update_vaccination_coverage();

-- ============================================================================
-- RLS POLICIES for vaccination views
-- ============================================================================
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maternal_health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_citizen_assistance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see vaccination data from their assigned barangay
CREATE POLICY vaccination_records_barangay_policy ON vaccination_records
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users WHERE barangay = vaccination_records.barangay
  )
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Health workers can see interventions in their barangay
CREATE POLICY health_interventions_barangay_policy ON health_interventions
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users WHERE barangay = health_interventions.barangay
  )
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- OPTIONAL BASELINE DATA INSERTION
-- ============================================================================
-- This section can be used to bootstrap healthcare records for the GIS map.
-- Review and adapt values to match your community profile before running.

-- Sample vaccination records
-- INSERT INTO vaccination_records (resident_id, barangay, vaccine_type, dose_number, vaccination_date)
-- SELECT 
--   id,
--   barangay,
--   (ARRAY['COVID-19', 'Polio', 'Measles'])[floor(random()*3 + 1)::int],
--   floor(random()*3 + 1)::int,
--   CURRENT_DATE - (floor(random()*365))::int
-- FROM residents
-- WHERE barangay IN ('San Juan', 'Santa Cruz', 'Quiapo', 'Binondo', 'Intramuros', 
--                    'Santa Ana', 'Tondo', 'Sampaloc', 'Malate', 'Ermita')
-- LIMIT 500;

-- ============================================================================
-- INDEXES for performance optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_barangay_summary_coverage 
ON barangay_vaccination_summary (vaccination_coverage_percentage);

CREATE INDEX IF NOT EXISTS idx_barangay_summary_interventions 
ON barangay_vaccination_summary (pending_interventions_count);

-- ============================================================================
-- GRANTS/PERMISSIONS
-- ============================================================================
-- Grant select permission on views to authenticated users
GRANT SELECT ON barangay_vaccination_summary TO authenticated;
GRANT SELECT ON barangay_health_status TO authenticated;

-- Grant all permissions on tables to service role (backend operations)
GRANT ALL ON vaccination_records TO service_role;
GRANT ALL ON health_interventions TO service_role;
GRANT ALL ON maternal_health_visits TO service_role;
GRANT ALL ON senior_citizen_assistance TO service_role;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 1. Run these migrations with admin/superuser privileges
-- 2. Ensure residents table exists before running this migration
-- 3. Update RLS policies based on your actual authentication setup
-- 4. Validate views and baseline data queries
-- 5. Monitor performance with EXPLAIN ANALYZE for large datasets
-- 6. Run periodic ANALYZE to update table statistics
-- ============================================================================

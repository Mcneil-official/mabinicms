-- ============================================================================
-- DATA SEED SCRIPT (INSERT / UPDATE / DELETE DATA OPERATIONS)
-- Run this after schema setup.
-- Generated: 2026-03-30
-- ============================================================================


-- ============================================================================
-- BEGIN FILE: migrations/008_replace_placeholder_with_realistic_healthcare_data.sql
-- ============================================================================

-- ============================================================================
-- REPLACE PLACEHOLDER/TEST DATA WITH REALISTIC HEALTHCARE RECORDS
-- Run this in Supabase SQL Editor (or via migration runner with privileged role)
-- ============================================================================

DO $$
DECLARE
  actor_id uuid;
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.users does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.residents') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.residents does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.health_facilities') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.health_facilities does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.yakap_applications') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.yakap_applications does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.vital_signs_history') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.vital_signs_history does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.appointments') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.appointments does not exist in this database.';
    RETURN;
  END IF;

  IF to_regclass('public.health_indicators') IS NULL THEN
    RAISE NOTICE 'Skipping seed: table public.health_indicators does not exist in this database.';
    RETURN;
  END IF;

  -- Use an existing user as created_by/administered_by/recorded_by reference.
  SELECT u.id
  INTO actor_id
  FROM public.users u
  ORDER BY u.created_at NULLS LAST
  LIMIT 1;

  -- If there is no user yet, create a deterministic seed user.
  IF actor_id IS NULL THEN
    INSERT INTO public.users (
      username,
      password_hash,
      assigned_barangay,
      user_role,
      created_at,
      updated_at
    )
    VALUES (
      'seed_staff',
      'seed_hash_change_me',
      'Laurel',
      'staff',
      NOW(),
      NOW()
    )
    ON CONFLICT (username) DO NOTHING;

    SELECT u.id
    INTO actor_id
    FROM public.users u
    WHERE u.username = 'seed_staff'
    LIMIT 1;
  END IF;

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve a seed actor from public.users.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 0) Seed operational users (idempotent)
  -- Default password for all inserted users: MabiniCare@2026
  -- IMPORTANT: Change these passwords immediately after first login.
  -- --------------------------------------------------------------------------

  INSERT INTO public.users (
    username,
    password_hash,
    assigned_barangay,
    user_role,
    created_at,
    updated_at
  )
  SELECT
    v.username,
    crypt('MabiniCare@2026', gen_salt('bf', 10)),
    v.assigned_barangay,
    v.user_role,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('hw_anilao_east', 'Anilao East', 'staff'),
      ('hw_anilao_proper', 'Anilao Proper', 'staff'),
      ('hw_bagalangit', 'Bagalangit', 'staff'),
      ('hw_bulacan', 'Bulacan', 'staff'),
      ('hw_calamias', 'Calamias', 'staff'),
      ('hw_estrella', 'Estrella', 'staff'),
      ('hw_gasang', 'Gasang', 'staff'),
      ('hw_laurel', 'Laurel', 'staff'),
      ('hw_ligaya', 'Ligaya', 'staff'),
      ('hw_mainaga', 'Mainaga', 'staff'),
      ('hw_mainit', 'Mainit', 'staff'),
      ('hw_majuben', 'Majuben', 'staff'),
      ('hw_malimatoc_i', 'Malimatoc I', 'staff'),
      ('hw_malimatoc_ii', 'Malimatoc II', 'staff'),
      ('hw_nag_iba', 'Nag-iba', 'staff'),
      ('hw_pilahan', 'Pilahan', 'staff'),
      ('hw_poblacion', 'Poblacion', 'staff'),
      ('hw_pulang_lupa', 'Pulang Lupa', 'staff'),
      ('hw_pulong_anahao', 'Pulong Anahao', 'staff'),
      ('hw_pulong_balibaguhan', 'Pulong Balibaguhan', 'staff'),
      ('hw_pulong_niogan', 'Pulong Niogan', 'staff'),
      ('hw_saguing', 'Saguing', 'staff'),
      ('hw_sampaguita', 'Sampaguita', 'staff'),
      ('hw_san_francisco', 'San Francisco', 'staff'),
      ('hw_san_jose', 'San Jose', 'staff'),
      ('hw_san_juan', 'San Juan', 'staff'),
      ('hw_san_teodoro', 'San Teodoro', 'staff'),
      ('hw_santa_ana', 'Santa Ana', 'staff'),
      ('hw_santa_mesa', 'Santa Mesa', 'staff'),
      ('hw_santo_nino', 'Santo Niño', 'staff'),
      ('hw_santo_tomas', 'Santo Tomas', 'staff'),
      ('hw_solo', 'Solo', 'staff'),
      ('hw_talaga_east', 'Talaga East', 'staff'),
      ('hw_talaga_proper', 'Talaga Proper', 'staff'),
      ('city_health_worker', NULL::text, 'workers'),
      ('admin_user', NULL::text, 'admin')
  ) AS v(username, assigned_barangay, user_role)
  ON CONFLICT (username) DO NOTHING;

  -- Ensure city-level account has global scope and worker role even if it already existed.
  UPDATE public.users
  SET
    assigned_barangay = NULL,
    user_role = 'workers',
    updated_at = NOW()
  WHERE username = 'city_health_worker';

  -- Ensure admin account stays admin and unscoped.
  UPDATE public.users
  SET
    assigned_barangay = NULL,
    user_role = 'admin',
    updated_at = NOW()
  WHERE username = 'admin_user';

  -- --------------------------------------------------------------------------
  -- 1) Remove obvious placeholder/test records
  -- --------------------------------------------------------------------------

  CREATE TEMP TABLE tmp_placeholder_residents ON COMMIT DROP AS
  SELECT r.id
  FROM public.residents r
  WHERE LOWER(COALESCE(r.full_name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%',
    '%juan dela cruz%', '%john doe%', '%jane doe%'
  ]);

  CREATE TEMP TABLE tmp_placeholder_facilities ON COMMIT DROP AS
  SELECT f.id
  FROM public.health_facilities f
  WHERE LOWER(COALESCE(f.name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%'
  ]);

  -- Child tables that contain free-text names often used in test rows
  DELETE FROM public.yakap_applications
  WHERE LOWER(COALESCE(resident_name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%',
    '%juan dela cruz%', '%john doe%', '%jane doe%'
  ])
  OR resident_id IN (SELECT id FROM tmp_placeholder_residents);

  -- Delete dependent rows first to satisfy restrictive foreign keys.
  IF to_regclass('public.appointments') IS NOT NULL THEN
    DELETE FROM public.appointments
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents)
       OR facility_id IN (SELECT id FROM tmp_placeholder_facilities);
  END IF;

  IF to_regclass('public.disease_cases') IS NOT NULL THEN
    DELETE FROM public.disease_cases
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.health_indicators') IS NOT NULL THEN
    DELETE FROM public.health_indicators
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.maternal_health_records') IS NOT NULL THEN
    DELETE FROM public.maternal_health_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.senior_assistance_records') IS NOT NULL THEN
    DELETE FROM public.senior_assistance_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.vaccination_records') IS NOT NULL THEN
    DELETE FROM public.vaccination_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.vital_signs_history') IS NOT NULL THEN
    DELETE FROM public.vital_signs_history
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL THEN
    DELETE FROM public.pregnancy_profiling_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.program_beneficiaries') IS NOT NULL THEN
    DELETE FROM public.program_beneficiaries
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.qr_scan_logs') IS NOT NULL THEN
    DELETE FROM public.qr_scan_logs
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents)
       OR facility_id IN (SELECT id FROM tmp_placeholder_facilities);
  END IF;

  IF to_regclass('public.medical_consultation_records') IS NOT NULL THEN
    DELETE FROM public.medical_consultation_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  -- Remove placeholder residents and facilities after child rows are cleared.
  DELETE FROM public.residents
  WHERE id IN (SELECT id FROM tmp_placeholder_residents);

  DELETE FROM public.health_facilities
  WHERE id IN (SELECT id FROM tmp_placeholder_facilities);

  -- --------------------------------------------------------------------------
  -- 2) Insert realistic resident records (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.residents (
    full_name,
    birth_date,
    sex,
    barangay,
    purok,
    contact_number,
    philhealth_no,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    v.full_name,
    v.birth_date,
    v.sex,
    v.barangay,
    v.purok,
    v.contact_number,
    v.philhealth_no,
    actor_id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', DATE '1989-06-14', 'Female', 'Laurel', 'Purok 1', '09171234501', '12-301234567-1'),
      ('Jose Miguel Ramos', DATE '1978-02-11', 'Male', 'Bulacan', 'Purok 3', '09171234502', '12-301234568-9'),
      ('Ana Patricia Lopez', DATE '1994-10-22', 'Female', 'Pilahan', 'Purok 2', '09171234503', '12-301234569-7'),
      ('Ramon Villanueva', DATE '1964-05-08', 'Male', 'Pulong Niogan', 'Purok 4', '09171234504', '12-301234570-5'),
      ('Clarissa Dizon', DATE '1991-12-02', 'Female', 'Anilao East', 'Purok 5', '09171234505', '12-301234571-3'),
      ('Leo Martin Castillo', DATE '1986-03-19', 'Male', 'Anilao Proper', 'Purok 1', '09171234506', '12-301234572-1'),
      ('Sheryl Mae Rivera', DATE '1997-08-27', 'Female', 'Bagalangit', 'Purok 2', '09171234507', '12-301234573-0'),
      ('Crisanto Reyes', DATE '1958-11-30', 'Male', 'Sampaguita', 'Purok 6', '09171234508', '12-301234574-8'),
      ('Janelle Soriano', DATE '2000-01-15', 'Female', 'Mainaga', 'Purok 2', '09171234509', '12-301234575-6'),
      ('Paolo Enrico Mendoza', DATE '1993-07-09', 'Male', 'Mainit', 'Purok 3', '09171234510', '12-301234576-4'),
      ('Helen Bautista', DATE '1972-04-25', 'Female', 'Gasang', 'Purok 1', '09171234511', '12-301234577-2'),
      ('Dominic Flores', DATE '1988-09-13', 'Male', 'Estrella', 'Purok 5', '09171234512', '12-301234578-0'),
      ('Lara Mae Gonzales', DATE '1995-05-17', 'Female', 'Calamias', 'Purok 4', '09171234513', '12-301234579-9'),
      ('Nilo Garcia', DATE '1960-10-03', 'Male', 'Poblacion', 'Purok 7', '09171234514', '12-301234580-7'),
      ('Teresita Alonzo', DATE '1956-01-28', 'Female', 'Pulong Balibaguhan', 'Purok 8', '09171234515', '12-301234581-5'),
      ('Geraldine Cruz', DATE '1992-02-20', 'Female', 'Pulong Anahao', 'Purok 2', '09171234516', '12-301234582-3'),
      ('Victor Manuel Ong', DATE '1984-06-01', 'Male', 'Saguing', 'Purok 1', '09171234517', '12-301234583-1'),
      ('Rhea Palma', DATE '1998-03-24', 'Female', 'San Francisco', 'Purok 5', '09171234518', '12-301234584-0'),
      ('Francis Tan', DATE '1976-08-06', 'Male', 'San Juan', 'Purok 3', '09171234519', '12-301234585-8'),
      ('Marlon Berces', DATE '1981-12-18', 'Male', 'Santa Ana', 'Purok 4', '09171234520', '12-301234586-6'),
      ('Catherine De Villa', DATE '1990-11-12', 'Female', 'Ligaya', 'Purok 2', '09171234521', '12-301234587-4'),
      ('Emilio Arce', DATE '1968-07-02', 'Male', 'Santo Niño', 'Purok 6', '09171234522', '12-301234588-2'),
      ('Isabel Panganiban', DATE '1987-09-29', 'Female', 'Malimatoc II', 'Purok 3', '09171234523', '12-301234589-0'),
      ('Noel Serrano', DATE '1979-04-16', 'Male', 'Nag-iba', 'Purok 4', '09171234524', '12-301234590-8')
  ) AS v(full_name, birth_date, sex, barangay, purok, contact_number, philhealth_no)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.residents r
    WHERE LOWER(r.full_name) = LOWER(v.full_name)
      AND r.birth_date = v.birth_date
  );

  -- --------------------------------------------------------------------------
  -- 3) Insert realistic health facilities
  -- --------------------------------------------------------------------------

  INSERT INTO public.health_facilities (
    name,
    barangay,
    address,
    operating_hours,
    contact_json,
    general_services,
    specialized_services,
    service_capability,
    yakap_accredited,
    created_at,
    updated_at
  )
  SELECT
    v.name,
    v.barangay,
    v.address,
    v.operating_hours,
    v.contact_json,
    v.general_services,
    v.specialized_services,
    v.service_capability,
    v.yakap_accredited,
    NOW(),
    NOW()
  FROM (
    VALUES
      (
        'Laurel Barangay Health Center',
        'Laurel',
        'Purok 1, Laurel, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0101","email":"cg.health@mabini.gov.ph"}'::jsonb,
        'Primary care, immunization, prenatal checkups',
        'Family planning counseling',
        'Level 1',
        true
      ),
      (
        'Pilahan Community Health Unit',
        'Pilahan',
        'Purok 2, Pilahan, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0102","email":"Pilahan.chu@mabini.gov.ph"}'::jsonb,
        'Outpatient consults, child health',
        'NCD screening',
        'Level 1',
        true
      ),
      (
        'Bulacan Primary Care Clinic',
        'Bulacan',
        'Purok 3, Bulacan, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0103","email":"Bulacan.pcc@mabini.gov.ph"}'::jsonb,
        'Immunization and wellness checks',
        'Senior care follow-up',
        'Level 1',
        false
      ),
      (
        'Pulong Niogan Family Health Station',
        'Pulong Niogan',
        'Purok 4, Pulong Niogan, Mabini, Batangas',
        '07:30-16:30',
        '{"phone":"(054) 881-0104","email":"sanfelipe.fhs@mabini.gov.ph"}'::jsonb,
        'Primary consults and prescriptions',
        'Home-care coordination',
        'Level 1',
        false
      ),
      (
        'Pulong Anahao Maternal and Child Center',
        'Pulong Anahao',
        'Purok 2, Pulong Anahao, Mabini, Batangas',
        '08:00-17:30',
        '{"phone":"(054) 881-0105","email":"Pulong Anahao.mcc@mabini.gov.ph"}'::jsonb,
        'Maternal and child outpatient services',
        'High-risk pregnancy triage',
        'Level 2',
        true
      ),
      (
        'Santa Ana Preventive Care Hub',
        'Santa Ana',
        'Purok 1, Santa Ana, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0106","email":"Santa Ana.pch@mabini.gov.ph"}'::jsonb,
        'Preventive screenings and vaccinations',
        'Lifestyle counseling',
        'Level 1',
        true
      )
  ) AS v(name, barangay, address, operating_hours, contact_json, general_services, specialized_services, service_capability, yakap_accredited)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.health_facilities f
    WHERE LOWER(f.name) = LOWER(v.name)
      AND LOWER(f.barangay) = LOWER(v.barangay)
  );

  -- --------------------------------------------------------------------------
  -- 4) Insert realistic vaccination records
  -- --------------------------------------------------------------------------

  INSERT INTO public.vaccination_records (
    resident_id,
    vaccine_name,
    dose_number,
    vaccine_date,
    next_dose_date,
    vaccination_site,
    administered_by,
    batch_number,
    status,
    notes,
    created_at
  )
  SELECT
    r.id,
    v.vaccine_name,
    v.dose_number,
    v.vaccine_date,
    v.next_dose_date,
    v.vaccination_site,
    actor_id,
    v.batch_number,
    v.status,
    v.notes,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 'Influenza', 1, DATE '2026-01-12', DATE '2027-01-12', 'Laurel Barangay Health Center', 'FLU-26-1001', 'completed', 'Annual influenza vaccination.'),
      ('Jose Miguel Ramos', 'Bulacan', 'Pneumococcal (PCV13)', 1, DATE '2025-11-20', NULL, 'Bulacan Primary Care Clinic', 'PCV-25-2330', 'completed', 'Age-based adult immunization.'),
      ('Ana Patricia Lopez', 'Pilahan', 'COVID-19 Booster', 1, DATE '2026-02-06', NULL, 'Pilahan Community Health Unit', 'C19-26-4412', 'completed', 'Booster dose completed.'),
      ('Ramon Villanueva', 'Pulong Niogan', 'Influenza', 1, DATE '2026-01-05', DATE '2027-01-05', 'Pulong Niogan Family Health Station', 'FLU-26-1009', 'completed', 'Senior annual vaccination.'),
      ('Clarissa Dizon', 'Anilao East', 'Tetanus-diphtheria', 1, DATE '2026-02-14', NULL, 'Laurel Barangay Health Center', 'TD-26-3288', 'completed', 'Post-exposure prophylaxis.'),
      ('Leo Martin Castillo', 'Anilao Proper', 'Hepatitis B', 2, DATE '2026-02-22', DATE '2026-05-22', 'Laurel Barangay Health Center', 'HEPB-26-7650', 'pending', 'Awaiting third dose.'),
      ('Sheryl Mae Rivera', 'Bagalangit', 'HPV', 1, DATE '2026-03-01', DATE '2026-09-01', 'Pulong Anahao Maternal and Child Center', 'HPV-26-2311', 'pending', 'Second dose scheduled after 6 months.'),
      ('Crisanto Reyes', 'Sampaguita', 'COVID-19 Booster', 1, DATE '2025-12-18', NULL, 'Pulong Niogan Family Health Station', 'C19-25-8920', 'completed', 'Bivalent booster administered.'),
      ('Janelle Soriano', 'Mainaga', 'Influenza', 1, DATE '2026-02-28', DATE '2027-02-28', 'Laurel Barangay Health Center', 'FLU-26-2219', 'completed', 'Routine annual dose.'),
      ('Paolo Enrico Mendoza', 'Mainit', 'Hepatitis B', 1, DATE '2026-03-04', DATE '2026-04-04', 'Santa Ana Preventive Care Hub', 'HEPB-26-7712', 'pending', 'Second dose due in one month.'),
      ('Helen Bautista', 'Gasang', 'Pneumococcal (PPSV23)', 1, DATE '2025-10-30', NULL, 'Pilahan Community Health Unit', 'PPSV-25-5577', 'completed', 'High-risk adult vaccination.'),
      ('Dominic Flores', 'Estrella', 'COVID-19 Booster', 1, DATE '2026-01-27', NULL, 'Santa Ana Preventive Care Hub', 'C19-26-6602', 'completed', 'Booster completed.'),
      ('Lara Mae Gonzales', 'Calamias', 'Tetanus-diphtheria', 1, DATE '2026-02-11', NULL, 'Pulong Anahao Maternal and Child Center', 'TD-26-3312', 'completed', 'Routine Td update.'),
      ('Nilo Garcia', 'Poblacion', 'Influenza', 1, DATE '2026-01-17', DATE '2027-01-17', 'Pulong Niogan Family Health Station', 'FLU-26-1144', 'completed', 'Seasonal vaccine.'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 'Pneumococcal (PCV13)', 1, DATE '2025-12-02', NULL, 'Pulong Niogan Family Health Station', 'PCV-25-2442', 'completed', 'Senior vaccination completed.'),
      ('Geraldine Cruz', 'Pulong Anahao', 'HPV', 2, DATE '2026-03-08', NULL, 'Pulong Anahao Maternal and Child Center', 'HPV-26-2380', 'completed', 'Second dose completed.'),
      ('Victor Manuel Ong', 'Saguing', 'Influenza', 1, DATE '2026-01-22', DATE '2027-01-22', 'Santa Ana Preventive Care Hub', 'FLU-26-1199', 'completed', 'Annual dose.'),
      ('Rhea Palma', 'San Francisco', 'COVID-19 Booster', 1, DATE '2026-02-18', NULL, 'Santa Ana Preventive Care Hub', 'C19-26-6921', 'completed', 'Booster completed.'),
      ('Francis Tan', 'San Juan', 'Hepatitis B', 1, DATE '2026-02-25', DATE '2026-03-25', 'Pilahan Community Health Unit', 'HEPB-26-7790', 'overdue', 'Second dose missed follow-up.'),
      ('Marlon Berces', 'Santa Ana', 'Influenza', 1, DATE '2026-01-30', DATE '2027-01-30', 'Santa Ana Preventive Care Hub', 'FLU-26-1277', 'completed', 'Routine annual vaccination.')
  ) AS v(full_name, barangay, vaccine_name, dose_number, vaccine_date, next_dose_date, vaccination_site, batch_number, status, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.vaccination_records vr
    WHERE vr.resident_id = r.id
      AND LOWER(vr.vaccine_name) = LOWER(v.vaccine_name)
      AND vr.dose_number = v.dose_number
      AND vr.vaccine_date = v.vaccine_date
  );

  -- --------------------------------------------------------------------------
  -- 5) Insert maternal health records
  -- --------------------------------------------------------------------------

  INSERT INTO public.maternal_health_records (
    resident_id,
    record_type,
    visit_date,
    trimester,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    weight,
    fetal_heart_rate,
    complications,
    status,
    notes,
    recorded_by,
    created_at,
    updated_at
  )
  SELECT
    r.id,
    v.record_type,
    v.visit_date,
    v.trimester,
    v.bp_sys,
    v.bp_dia,
    v.weight,
    v.fhr,
    v.complications,
    v.status,
    v.notes,
    actor_id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 'antenatal', DATE '2026-01-10', 2, 112, 72, 58.3, 146, NULL, 'normal', 'Routine prenatal checkup, no warning signs.'),
      ('Maria Luisa Santos', 'Laurel', 'antenatal', DATE '2026-02-10', 3, 116, 74, 59.6, 148, NULL, 'normal', 'Good fetal movement, advised iron continuation.'),
      ('Ana Patricia Lopez', 'Pilahan', 'antenatal', DATE '2026-01-21', 1, 118, 76, 55.2, 150, NULL, 'normal', 'Initial prenatal intake complete.'),
      ('Ana Patricia Lopez', 'Pilahan', 'antenatal', DATE '2026-02-20', 2, 120, 78, 56.0, 149, 'Mild ankle edema', 'warning', 'Hydration and rest counseling given.'),
      ('Clarissa Dizon', 'Anilao East', 'postnatal', DATE '2026-03-02', NULL, 114, 73, 60.1, NULL, NULL, 'normal', 'Postnatal follow-up, mother stable.'),
      ('Lara Mae Gonzales', 'Calamias', 'antenatal', DATE '2026-02-12', 2, 110, 70, 57.0, 147, NULL, 'normal', 'No complications reported.'),
      ('Geraldine Cruz', 'Pulong Anahao', 'antenatal', DATE '2026-02-28', 3, 122, 80, 61.4, 151, 'Occasional headache', 'warning', 'Advised BP monitoring every week.'),
      ('Rhea Palma', 'San Francisco', 'antenatal', DATE '2026-03-06', 1, 108, 68, 54.8, 145, NULL, 'normal', 'Prenatal vitamins started.')
  ) AS v(full_name, barangay, record_type, visit_date, trimester, bp_sys, bp_dia, weight, fhr, complications, status, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.maternal_health_records m
    WHERE m.resident_id = r.id
      AND m.record_type = v.record_type
      AND m.visit_date = v.visit_date
  );

  -- --------------------------------------------------------------------------
  -- 6) Insert senior assistance records
  -- --------------------------------------------------------------------------

  INSERT INTO public.senior_assistance_records (
    resident_id,
    assistance_type,
    visit_date,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    blood_glucose,
    medications_given,
    vital_status,
    status,
    notes,
    recorded_by,
    follow_up_date,
    created_at,
    updated_at
  )
  SELECT
    r.id,
    v.assistance_type,
    v.visit_date,
    v.bp_sys,
    v.bp_dia,
    v.glucose,
    v.meds,
    v.vital_status,
    v.status,
    v.notes,
    actor_id,
    v.follow_up_date,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Ramon Villanueva', 'Pulong Niogan', 'medical_support', DATE '2026-02-03', 128, 80, 104.0, 'Amlodipine 5mg once daily', 'stable', 'completed', 'Monthly BP monitoring visit completed.', DATE '2026-03-03'),
      ('Crisanto Reyes', 'Sampaguita', 'home_care', DATE '2026-02-07', 132, 82, 110.5, 'Losartan 50mg once daily', 'stable', 'completed', 'Home visit with medication adherence check.', DATE '2026-03-07'),
      ('Nilo Garcia', 'Poblacion', 'medication_delivery', DATE '2026-02-10', 136, 84, 122.0, 'Metformin 500mg twice daily', 'improved', 'completed', 'Delivered one-month maintenance meds.', DATE '2026-03-10'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 'mobility_support', DATE '2026-02-15', 124, 78, 101.0, 'Calcium + Vitamin D daily', 'stable', 'completed', 'Assisted mobility exercise session.', DATE '2026-03-15'),
      ('Helen Bautista', 'Gasang', 'mental_health', DATE '2026-02-18', 126, 80, 98.5, 'None', 'improved', 'completed', 'Psychosocial support counseling provided.', DATE '2026-03-18'),
        ('Emilio Arce', 'Santo Niño', 'social_services', DATE '2026-02-22', 138, 86, 130.4, 'Gliclazide MR 30mg once daily', 'declining', 'pending', 'Referred for physician review due elevated glucose.', DATE '2026-03-01')
  ) AS v(full_name, barangay, assistance_type, visit_date, bp_sys, bp_dia, glucose, meds, vital_status, status, notes, follow_up_date)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.senior_assistance_records s
    WHERE s.resident_id = r.id
      AND s.assistance_type = v.assistance_type
      AND s.visit_date = v.visit_date
  );

  -- --------------------------------------------------------------------------
  -- 7) Insert vital signs history baseline (20 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.vital_signs_history (
    resident_id,
    systolic,
    diastolic,
    temperature,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    height,
    bmi,
    recorded_by,
    recorded_at,
    notes,
    created_at
  )
  SELECT
    r.id,
    v.systolic,
    v.diastolic,
    v.temperature,
    v.heart_rate,
    v.respiratory_rate,
    v.oxygen_saturation,
    v.weight,
    v.height,
    v.bmi,
    actor_id,
    v.recorded_at,
    v.notes,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 112, 72, 36.7, 78, 18, 98.0, 58.3, 160.0, 22.8, TIMESTAMPTZ '2026-03-01 08:30:00+08', 'Prenatal follow-up vitals stable.'),
      ('Jose Miguel Ramos', 'Bulacan', 124, 80, 36.6, 74, 18, 97.0, 67.5, 168.0, 23.9, TIMESTAMPTZ '2026-03-01 09:00:00+08', 'Routine adult checkup.'),
      ('Ana Patricia Lopez', 'Pilahan', 118, 76, 36.8, 80, 19, 99.0, 56.0, 157.0, 22.7, TIMESTAMPTZ '2026-03-01 09:30:00+08', 'Mild edema monitored.'),
      ('Ramon Villanueva', 'Pulong Niogan', 128, 80, 36.5, 72, 18, 97.0, 65.2, 166.0, 23.7, TIMESTAMPTZ '2026-03-01 10:00:00+08', 'Senior assessment visit.'),
      ('Clarissa Dizon', 'Anilao East', 114, 73, 36.7, 77, 18, 98.0, 60.1, 161.0, 23.2, TIMESTAMPTZ '2026-03-01 10:30:00+08', 'Postnatal review.'),
      ('Leo Martin Castillo', 'Anilao Proper', 122, 78, 36.8, 76, 18, 98.0, 70.5, 170.0, 24.4, TIMESTAMPTZ '2026-03-01 11:00:00+08', 'Hep B follow-up.'),
      ('Sheryl Mae Rivera', 'Bagalangit', 110, 70, 36.6, 79, 18, 99.0, 52.7, 155.0, 21.9, TIMESTAMPTZ '2026-03-01 11:30:00+08', 'HPV first dose follow-up.'),
      ('Crisanto Reyes', 'Sampaguita', 132, 82, 36.4, 70, 17, 97.0, 63.0, 165.0, 23.1, TIMESTAMPTZ '2026-03-01 13:00:00+08', 'Home-care monitoring.'),
      ('Janelle Soriano', 'Mainaga', 108, 68, 36.7, 82, 19, 99.0, 50.4, 154.0, 21.3, TIMESTAMPTZ '2026-03-01 13:30:00+08', 'Young adult preventive check.'),
      ('Paolo Enrico Mendoza', 'Mainit', 120, 78, 36.8, 75, 18, 98.0, 68.1, 172.0, 23.0, TIMESTAMPTZ '2026-03-01 14:00:00+08', 'Adult preventive check.'),
      ('Helen Bautista', 'Gasang', 126, 80, 36.5, 73, 18, 97.0, 59.4, 158.0, 23.8, TIMESTAMPTZ '2026-03-01 14:30:00+08', 'NCD monitoring visit.'),
      ('Dominic Flores', 'Estrella', 118, 76, 36.6, 74, 18, 98.0, 71.3, 173.0, 23.8, TIMESTAMPTZ '2026-03-01 15:00:00+08', 'Booster follow-up.'),
      ('Lara Mae Gonzales', 'Calamias', 110, 70, 36.7, 79, 18, 99.0, 57.0, 159.0, 22.5, TIMESTAMPTZ '2026-03-01 15:30:00+08', 'Prenatal monitoring.'),
      ('Nilo Garcia', 'Poblacion', 136, 84, 36.5, 71, 17, 97.0, 69.0, 167.0, 24.7, TIMESTAMPTZ '2026-03-01 16:00:00+08', 'Medication delivery visit.'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 124, 78, 36.6, 72, 18, 98.0, 58.2, 156.0, 23.9, TIMESTAMPTZ '2026-03-02 08:30:00+08', 'Senior mobility support.'),
      ('Geraldine Cruz', 'Pulong Anahao', 122, 80, 36.8, 81, 19, 98.0, 61.4, 162.0, 23.4, TIMESTAMPTZ '2026-03-02 09:00:00+08', 'Third-trimester assessment.'),
      ('Victor Manuel Ong', 'Saguing', 120, 76, 36.6, 74, 18, 98.0, 72.4, 174.0, 23.9, TIMESTAMPTZ '2026-03-02 09:30:00+08', 'Annual check and counseling.'),
      ('Rhea Palma', 'San Francisco', 108, 68, 36.7, 80, 18, 99.0, 54.8, 158.0, 22.0, TIMESTAMPTZ '2026-03-02 10:00:00+08', 'Early pregnancy routine check.'),
      ('Francis Tan', 'San Juan', 130, 82, 36.5, 73, 18, 97.0, 70.2, 171.0, 24.0, TIMESTAMPTZ '2026-03-02 10:30:00+08', 'Overdue vaccine counseling.'),
      ('Marlon Berces', 'Santa Ana', 118, 74, 36.6, 75, 18, 98.0, 73.5, 175.0, 24.0, TIMESTAMPTZ '2026-03-02 11:00:00+08', 'Preventive screening normal.')
  ) AS v(full_name, barangay, systolic, diastolic, temperature, heart_rate, respiratory_rate, oxygen_saturation, weight, height, bmi, recorded_at, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.vital_signs_history vs
    WHERE vs.resident_id = r.id
      AND vs.recorded_at = v.recorded_at
  );

  -- --------------------------------------------------------------------------
  -- 8) Insert appointments baseline (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.appointments (
    facility_id,
    resident_id,
    appointment_date,
    time_slot,
    service_type,
    status,
    booked_at,
    notes,
    created_at,
    updated_at
  )
  SELECT
    f.id,
    r.id,
    v.appointment_date,
    v.time_slot,
    v.service_type,
    v.status,
    v.booked_at,
    v.notes,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel Barangay Health Center', DATE '2026-03-18', '08:30-09:00', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 09:00:00+08', 'Third trimester follow-up'),
      ('Jose Miguel Ramos', 'Bulacan Primary Care Clinic', DATE '2026-03-19', '09:00-09:30', 'Hypertension Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 09:15:00+08', 'BP monitoring'),
      ('Ana Patricia Lopez', 'Pilahan Community Health Unit', DATE '2026-03-20', '10:00-10:30', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 09:30:00+08', 'Routine ANC'),
      ('Ramon Villanueva', 'Pulong Niogan Family Health Station', DATE '2026-03-20', '13:00-13:30', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 09:45:00+08', 'Medication refill review'),
      ('Clarissa Dizon', 'Laurel Barangay Health Center', DATE '2026-03-21', '09:30-10:00', 'Postnatal Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 10:00:00+08', '6-week postnatal check'),
      ('Leo Martin Castillo', 'Laurel Barangay Health Center', DATE '2026-03-22', '11:00-11:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 10:15:00+08', 'Hep B next dose'),
      ('Sheryl Mae Rivera', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-22', '14:00-14:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 10:30:00+08', 'HPV counseling and follow-up'),
      ('Crisanto Reyes', 'Pulong Niogan Family Health Station', DATE '2026-03-23', '08:00-08:30', 'Home-care Plan Review', 'booked', TIMESTAMPTZ '2026-03-10 10:45:00+08', 'Senior case conference'),
      ('Janelle Soriano', 'Laurel Barangay Health Center', DATE '2026-03-23', '10:30-11:00', 'Wellness Check', 'booked', TIMESTAMPTZ '2026-03-10 11:00:00+08', 'Routine wellness check'),
      ('Paolo Enrico Mendoza', 'Santa Ana Preventive Care Hub', DATE '2026-03-24', '15:00-15:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 11:15:00+08', 'Hep B dose scheduling'),
      ('Helen Bautista', 'Pilahan Community Health Unit', DATE '2026-03-24', '09:00-09:30', 'NCD Monitoring', 'booked', TIMESTAMPTZ '2026-03-10 11:30:00+08', 'BP and glucose review'),
      ('Dominic Flores', 'Santa Ana Preventive Care Hub', DATE '2026-03-25', '08:30-09:00', 'Booster Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 11:45:00+08', 'Post booster assessment'),
      ('Lara Mae Gonzales', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-25', '10:00-10:30', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 12:00:00+08', 'Routine ANC visit'),
      ('Nilo Garcia', 'Pulong Niogan Family Health Station', DATE '2026-03-26', '13:30-14:00', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 12:15:00+08', 'Diabetes medication reassessment'),
      ('Teresita Alonzo', 'Pulong Niogan Family Health Station', DATE '2026-03-26', '14:30-15:00', 'Mobility Support', 'booked', TIMESTAMPTZ '2026-03-10 12:30:00+08', 'Physical mobility re-evaluation'),
      ('Geraldine Cruz', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-27', '08:30-09:00', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 12:45:00+08', 'High-risk monitoring'),
      ('Victor Manuel Ong', 'Santa Ana Preventive Care Hub', DATE '2026-03-27', '11:00-11:30', 'Wellness Check', 'booked', TIMESTAMPTZ '2026-03-10 13:00:00+08', 'Annual physical follow-up'),
      ('Rhea Palma', 'Santa Ana Preventive Care Hub', DATE '2026-03-28', '09:30-10:00', 'Prenatal Intake', 'booked', TIMESTAMPTZ '2026-03-10 13:15:00+08', 'Initial ANC package'),
      ('Francis Tan', 'Pilahan Community Health Unit', DATE '2026-03-28', '13:00-13:30', 'Vaccination Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 13:30:00+08', 'Overdue second dose counseling'),
      ('Marlon Berces', 'Santa Ana Preventive Care Hub', DATE '2026-03-29', '15:30-16:00', 'Preventive Screening', 'booked', TIMESTAMPTZ '2026-03-10 13:45:00+08', 'Lifestyle screening'),
      ('Isabel Panganiban', 'Laurel Barangay Health Center', DATE '2026-03-30', '08:00-08:30', 'General Consultation', 'booked', TIMESTAMPTZ '2026-03-10 14:00:00+08', 'General symptom check'),
      ('Noel Serrano', 'Pilahan Community Health Unit', DATE '2026-03-30', '10:30-11:00', 'NCD Screening', 'booked', TIMESTAMPTZ '2026-03-10 14:15:00+08', 'BP and glucose screening'),
      ('Catherine De Villa', 'Laurel Barangay Health Center', DATE '2026-03-31', '09:00-09:30', 'Family Planning', 'booked', TIMESTAMPTZ '2026-03-10 14:30:00+08', 'Counseling session'),
      ('Emilio Arce', 'Pulong Niogan Family Health Station', DATE '2026-03-31', '14:00-14:30', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 14:45:00+08', 'Follow-up after social services referral')
  ) AS v(full_name, facility_name, appointment_date, time_slot, service_type, status, booked_at, notes)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  JOIN public.health_facilities f ON LOWER(f.name) = LOWER(v.facility_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.resident_id = r.id
      AND a.facility_id = f.id
      AND a.appointment_date = v.appointment_date
      AND a.time_slot = v.time_slot
  );

  -- --------------------------------------------------------------------------
  -- 9) Insert YAKAP applications baseline (20 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.yakap_applications (
    resident_name,
    barangay,
    membership_type,
    philhealth_no,
    status,
    applied_at,
    approved_by,
    approved_at,
    remarks,
    resident_id,
    created_at,
    updated_at
  )
  SELECT
    r.full_name,
    r.barangay,
    v.membership_type,
    r.philhealth_no,
    v.status,
    v.applied_at,
    CASE WHEN v.status = 'approved' THEN actor_id ELSE NULL END,
    CASE WHEN v.status = 'approved' THEN v.applied_at + INTERVAL '3 days' ELSE NULL END,
    v.remarks,
    r.id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'family', 'approved', TIMESTAMPTZ '2026-02-01 08:00:00+08', 'Validated household records.'),
      ('Jose Miguel Ramos', 'individual', 'pending', TIMESTAMPTZ '2026-02-02 09:00:00+08', 'Awaiting final verification.'),
      ('Ana Patricia Lopez', 'family', 'approved', TIMESTAMPTZ '2026-02-03 08:30:00+08', 'Eligibility confirmed.'),
      ('Ramon Villanueva', 'senior', 'approved', TIMESTAMPTZ '2026-02-04 10:00:00+08', 'Senior category complete.'),
      ('Clarissa Dizon', 'individual', 'pending', TIMESTAMPTZ '2026-02-05 11:00:00+08', 'Pending document upload.'),
      ('Leo Martin Castillo', 'family', 'pending', TIMESTAMPTZ '2026-02-06 08:15:00+08', 'For barangay validation.'),
      ('Sheryl Mae Rivera', 'individual', 'approved', TIMESTAMPTZ '2026-02-07 09:20:00+08', 'Member registration approved.'),
      ('Crisanto Reyes', 'senior', 'approved', TIMESTAMPTZ '2026-02-08 10:40:00+08', 'Senior benefits activated.'),
      ('Janelle Soriano', 'individual', 'pending', TIMESTAMPTZ '2026-02-09 11:30:00+08', 'Queued for review.'),
      ('Paolo Enrico Mendoza', 'family', 'returned', TIMESTAMPTZ '2026-02-10 13:00:00+08', 'Please update contact details.'),
      ('Helen Bautista', 'pwd', 'approved', TIMESTAMPTZ '2026-02-11 14:00:00+08', 'PWD category validated.'),
      ('Dominic Flores', 'individual', 'pending', TIMESTAMPTZ '2026-02-12 08:45:00+08', 'Pending ID verification.'),
      ('Lara Mae Gonzales', 'family', 'approved', TIMESTAMPTZ '2026-02-13 09:50:00+08', 'Family enrollment successful.'),
      ('Nilo Garcia', 'senior', 'approved', TIMESTAMPTZ '2026-02-14 10:10:00+08', 'Senior enrollment approved.'),
      ('Teresita Alonzo', 'senior', 'approved', TIMESTAMPTZ '2026-02-15 11:10:00+08', 'Senior enrollment approved.'),
      ('Geraldine Cruz', 'family', 'pending', TIMESTAMPTZ '2026-02-16 08:20:00+08', 'Pending household dependency docs.'),
      ('Victor Manuel Ong', 'individual', 'approved', TIMESTAMPTZ '2026-02-17 09:40:00+08', 'Application approved after interview.'),
      ('Rhea Palma', 'family', 'pending', TIMESTAMPTZ '2026-02-18 10:50:00+08', 'In progress review.'),
      ('Francis Tan', 'individual', 'returned', TIMESTAMPTZ '2026-02-19 13:15:00+08', 'Submit clearer PhilHealth image.'),
      ('Marlon Berces', 'family', 'approved', TIMESTAMPTZ '2026-02-20 14:25:00+08', 'Application complete and approved.')
  ) AS v(full_name, membership_type, status, applied_at, remarks)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.yakap_applications y
    WHERE y.resident_id = r.id
      AND y.membership_type = v.membership_type
      AND y.applied_at = v.applied_at
  );

  -- --------------------------------------------------------------------------
  -- 10) Insert health indicator baseline (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.health_indicators (
    resident_id,
    indicator_type,
    value,
    unit,
    status,
    notes,
    recorded_by,
    recorded_at,
    created_at
  )
  SELECT
    r.id,
    v.indicator_type,
    v.value,
    v.unit,
    v.status,
    v.notes,
    actor_id,
    v.recorded_at,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'blood_pressure', 112, 'mmHg', 'normal', 'ANC visit BP systolic', TIMESTAMPTZ '2026-03-01 08:30:00+08'),
      ('Maria Luisa Santos', 'heart_rate', 78, 'bpm', 'normal', 'Resting pulse', TIMESTAMPTZ '2026-03-01 08:31:00+08'),
      ('Jose Miguel Ramos', 'blood_pressure', 124, 'mmHg', 'normal', 'Routine BP check', TIMESTAMPTZ '2026-03-01 09:00:00+08'),
      ('Jose Miguel Ramos', 'glucose', 104.0, 'mg/dL', 'normal', 'Fasting glucose', TIMESTAMPTZ '2026-03-01 09:05:00+08'),
      ('Ana Patricia Lopez', 'temperature', 36.8, 'C', 'normal', 'No fever', TIMESTAMPTZ '2026-03-01 09:30:00+08'),
      ('Ana Patricia Lopez', 'weight', 56.0, 'kg', 'normal', 'Prenatal weight check', TIMESTAMPTZ '2026-03-01 09:31:00+08'),
      ('Ramon Villanueva', 'blood_pressure', 128, 'mmHg', 'warning', 'Borderline systolic', TIMESTAMPTZ '2026-03-01 10:00:00+08'),
      ('Ramon Villanueva', 'oxygen_saturation', 97.0, '%', 'normal', 'Pulse oximetry', TIMESTAMPTZ '2026-03-01 10:01:00+08'),
      ('Clarissa Dizon', 'heart_rate', 77, 'bpm', 'normal', 'Postnatal pulse', TIMESTAMPTZ '2026-03-01 10:30:00+08'),
      ('Clarissa Dizon', 'respiratory_rate', 18, 'breaths/min', 'normal', 'Respiratory assessment', TIMESTAMPTZ '2026-03-01 10:31:00+08'),
      ('Leo Martin Castillo', 'blood_pressure', 122, 'mmHg', 'normal', 'Pre-vaccine BP', TIMESTAMPTZ '2026-03-01 11:00:00+08'),
      ('Sheryl Mae Rivera', 'temperature', 36.6, 'C', 'normal', 'Pre-vaccine temperature', TIMESTAMPTZ '2026-03-01 11:30:00+08'),
      ('Crisanto Reyes', 'glucose', 110.5, 'mg/dL', 'warning', 'Senior glucose monitor', TIMESTAMPTZ '2026-03-01 13:00:00+08'),
      ('Janelle Soriano', 'bmi', 21.3, 'kg/m2', 'normal', 'Wellness BMI', TIMESTAMPTZ '2026-03-01 13:30:00+08'),
      ('Paolo Enrico Mendoza', 'blood_pressure', 120, 'mmHg', 'normal', 'Routine screening', TIMESTAMPTZ '2026-03-01 14:00:00+08'),
      ('Helen Bautista', 'glucose', 98.5, 'mg/dL', 'normal', 'Random glucose check', TIMESTAMPTZ '2026-03-01 14:30:00+08'),
      ('Dominic Flores', 'oxygen_saturation', 98.0, '%', 'normal', 'Post-vaccine observation', TIMESTAMPTZ '2026-03-01 15:00:00+08'),
      ('Lara Mae Gonzales', 'weight', 57.0, 'kg', 'normal', 'Prenatal weight monitor', TIMESTAMPTZ '2026-03-01 15:30:00+08'),
      ('Nilo Garcia', 'blood_pressure', 136, 'mmHg', 'warning', 'Elevated systolic noted', TIMESTAMPTZ '2026-03-01 16:00:00+08'),
      ('Teresita Alonzo', 'blood_pressure', 124, 'mmHg', 'normal', 'Senior monitoring', TIMESTAMPTZ '2026-03-02 08:30:00+08'),
      ('Geraldine Cruz', 'heart_rate', 81, 'bpm', 'normal', 'Third-trimester pulse', TIMESTAMPTZ '2026-03-02 09:00:00+08'),
      ('Victor Manuel Ong', 'bmi', 23.9, 'kg/m2', 'normal', 'Annual screening BMI', TIMESTAMPTZ '2026-03-02 09:30:00+08'),
      ('Rhea Palma', 'temperature', 36.7, 'C', 'normal', 'Prenatal intake temperature', TIMESTAMPTZ '2026-03-02 10:00:00+08'),
      ('Francis Tan', 'blood_pressure', 130, 'mmHg', 'warning', 'Follow-up due overdue dose', TIMESTAMPTZ '2026-03-02 10:30:00+08')
  ) AS v(full_name, indicator_type, value, unit, status, notes, recorded_at)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.health_indicators hi
    WHERE hi.resident_id = r.id
      AND hi.indicator_type = v.indicator_type
      AND hi.recorded_at = v.recorded_at
  );

  RAISE NOTICE 'Placeholder cleanup + realistic healthcare seed completed successfully.';
END
$$;


-- END FILE: migrations/008_replace_placeholder_with_realistic_healthcare_data.sql


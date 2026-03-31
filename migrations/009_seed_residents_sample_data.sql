-- ============================================================================
-- SAMPLE DATA: public.residents
-- Safe to run multiple times (idempotent by full_name + birth_date)
-- ============================================================================

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
  NULL::uuid,
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
    ('Emilio Arce', DATE '1968-07-02', 'Male', 'Santo Nino', 'Purok 6', '09171234522', '12-301234588-2'),
    ('Isabel Panganiban', DATE '1987-09-29', 'Female', 'Malimatoc II', 'Purok 3', '09171234523', '12-301234589-0'),
    ('Noel Serrano', DATE '1979-04-16', 'Male', 'Nag-iba', 'Purok 4', '09171234524', '12-301234590-8')
) AS v(full_name, birth_date, sex, barangay, purok, contact_number, philhealth_no)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.residents r
  WHERE LOWER(r.full_name) = LOWER(v.full_name)
    AND r.birth_date = v.birth_date
);

import { z } from "zod";

export const barangayProfileSchema = z.object({
  // Part 1 – Membership & Personal
  membership_type: z.enum(["member", "dependent"]),
  philhealth_no: z.string().optional().nullable(),
  last_name: z.string().min(1, "Last name is required"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  civil_status: z
    .enum(["single", "married", "widowed", "separated", "annulled"])
    .optional()
    .nullable(),
  maiden_last_name: z.string().optional().nullable(),
  maiden_middle_name: z.string().optional().nullable(),
  educational_attainment: z
    .enum([
      "no_formal",
      "elementary",
      "high_school",
      "senior_high",
      "vocational",
      "college",
      "post_grad",
    ])
    .optional()
    .nullable(),
  employment_status: z
    .enum(["employed", "self_employed", "unemployed", "student", "retired"])
    .optional()
    .nullable(),
  employed_in: z.enum(["government", "private"]).optional().nullable(),
  occupation: z.string().optional().nullable(),
  company_address: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  blood_type: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .nullable(),

  // Part 2 – Family Background
  mother_last_name: z.string().optional().nullable(),
  mother_first_name: z.string().optional().nullable(),
  mother_middle_name: z.string().optional().nullable(),
  mother_birthdate: z.string().optional().nullable(),
  father_last_name: z.string().optional().nullable(),
  father_first_name: z.string().optional().nullable(),
  father_middle_name: z.string().optional().nullable(),
  father_birthdate: z.string().optional().nullable(),
  spouse_last_name: z.string().optional().nullable(),
  spouse_first_name: z.string().optional().nullable(),
  spouse_birthdate: z.string().optional().nullable(),

  // Part 3 – Address & Contact
  current_barangay: z.string().optional().nullable(),
  current_street: z.string().optional().nullable(),
  current_city: z.string().optional().nullable(),
  current_province: z.string().optional().nullable(),
  permanent_barangay: z.string().optional().nullable(),
  permanent_street: z.string().optional().nullable(),
  permanent_city: z.string().optional().nullable(),
  permanent_province: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  mobile: z.string().optional().nullable(),

  // Part 4 – Pregnancy + Medical/Surgical History
  is_pregnant: z.enum(["yes", "no"]).optional().nullable(),
  pregnancy_months: z.coerce.number().int().min(0).max(10).optional().nullable(),
  gravida: z.coerce.number().int().min(0).optional().nullable(),
  para: z.coerce.number().int().min(0).optional().nullable(),
  lmp: z.string().optional().nullable(),
  edd: z.string().optional().nullable(),
  prenatal_checkup_date: z.string().optional().nullable(),
  pregnancy_risk_level: z.enum(["low", "moderate", "high"]).optional().nullable(),
  pregnancy_remarks: z.string().optional().nullable(),
  has_hypertension: z.string().optional().nullable(),
  has_diabetes: z.string().optional().nullable(),
  has_asthma: z.string().optional().nullable(),
  has_heart_disease: z.string().optional().nullable(),
  past_surgeries: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  hospitalization_history: z.string().optional().nullable(),
  past_medical_history: z.string().optional().nullable(),
  pmh_specify_allergy: z.string().optional().nullable(),
  pmh_specify_organ_cancer: z.string().optional().nullable(),
  pmh_specify_hepatitis_type: z.string().optional().nullable(),
  pmh_highest_blood_pressure: z.string().optional().nullable(),
  pmh_specify_pulmonary_tb_category: z.string().optional().nullable(),
  pmh_specify_extrapulmonary_tb_category: z.string().optional().nullable(),
  pmh_others_specify: z.string().optional().nullable(),
  past_surgical_history: z.string().optional().nullable(),

  // Part 5 – Family & Personal History
  family_hypertension: z.string().optional().nullable(),
  family_diabetes: z.string().optional().nullable(),
  family_asthma: z.string().optional().nullable(),
  family_cancer: z.string().optional().nullable(),
  family_history: z.string().optional().nullable(),
  fh_specify_allergy: z.string().optional().nullable(),
  fh_specify_organ_cancer: z.string().optional().nullable(),
  fh_specify_hepatitis_type: z.string().optional().nullable(),
  fh_highest_blood_pressure: z.string().optional().nullable(),
  fh_specify_pulmonary_tb_category: z.string().optional().nullable(),
  fh_specify_extrapulmonary_tb_category: z.string().optional().nullable(),
  fh_others_specify: z.string().optional().nullable(),
  smoking_status: z.string().optional().nullable(),
  smoking_packs_per_year: z.string().optional().nullable(),
  alcohol_intake: z.string().optional().nullable(),
  alcohol_bottles_per_day: z.string().optional().nullable(),
  illicit_drugs: z.string().optional().nullable(),
  sexually_active: z.string().optional().nullable(),
  exercise_frequency: z.string().optional().nullable(),
  dietary_pattern: z.string().optional().nullable(),
  personal_history_notes: z.string().optional().nullable(),
});

export type BarangayProfileInput = z.infer<typeof barangayProfileSchema>;

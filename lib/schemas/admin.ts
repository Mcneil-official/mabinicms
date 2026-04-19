import { z } from "zod";

const userRoleSchema = z.enum(["admin", "staff", "workers", "user"]);

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  role: z.union([userRoleSchema, z.literal(""), z.literal("all")]).default(""),
  status: z.enum(["", "all", "active", "inactive"]).default(""),
});

export const adminCreateUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8).max(128),
  role: userRoleSchema,
  assigned_barangay: z.string().trim().min(1).max(120).nullable().optional(),
});

export const adminUpdateUserSchema = z.object({
  role: userRoleSchema.optional(),
  assigned_barangay: z.string().trim().min(1).max(120).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const adminDeactivateUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const adminFacilitiesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  barangay: z.string().trim().max(120).default(""),
  status: z.enum(["", "all", "active", "inactive"]).default("active"),
});

export const adminUpsertFacilitySchema = z.object({
  name: z.string().trim().min(2).max(150),
  barangay: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  operating_hours: z.record(z.string(), z.string()).optional(),
  capacity: z.number().int().min(0).max(100000).nullable().optional(),
});

export const adminDeactivateFacilitySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const adminAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().trim().max(100).default(""),
  resourceType: z.string().trim().max(100).default(""),
  status: z.string().trim().max(100).default(""),
  startDate: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  userId: z.string().trim().max(120).default(""),
});

export const adminAuditExportSchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  filters: z
    .object({
      action: z.string().trim().max(100).optional(),
      resourceType: z.string().trim().max(100).optional(),
      status: z.string().trim().max(100).optional(),
      startDate: z.string().trim().optional(),
      endDate: z.string().trim().optional(),
    })
    .default({}),
});

export const adminWorkerOperationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  barangay: z.string().trim().max(120).default(""),
  status: z.enum(["", "all", "active", "inactive"]).default("all"),
});

export const adminSystemSettingsSchema = z.object({
  notificationRetentionDays: z.number().int().min(1).max(3650),
  lowStockAlertThreshold: z.number().int().min(0).max(100000),
  enableMedicationAutoSuggestions: z.boolean(),
  enableAuditCsvExport: z.boolean(),
  systemMaintenanceMode: z.boolean(),
  defaultAnnouncementAudience: z.array(z.string().trim().min(1).max(120)).max(100),
});

export type AdminSystemSettingsInput = z.infer<typeof adminSystemSettingsSchema>;

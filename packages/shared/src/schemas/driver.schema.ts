import { z } from 'zod';

// ─── Create Driver ───────────────────────────────────
export const createDriverSchema = z.object({
  driverNo: z.string().min(1).max(30),
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  licenseNo: z.string().max(30).optional(),
  rfidCardNo: z.string().max(30).optional(),
  registerPlace: z.string().max(100).optional(),
  organizationId: z.string().uuid().optional(),
  licenseExpiry: z.string().datetime().optional(),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;

// ─── Update Driver ───────────────────────────────────
export const updateDriverSchema = z.object({
  driverNo: z.string().min(1).max(30).optional(),
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  licenseNo: z.string().max(30).optional(),
  rfidCardNo: z.string().max(30).optional(),
  registerPlace: z.string().max(100).optional(),
  licenseExpiry: z.string().datetime().nullable().optional(),
});
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// ─── Driver Query Filters ────────────────────────────
export const driverQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  licenseExpired: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;

import { z } from 'zod';

// ─── Create Device ───────────────────────────────────
export const createDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  imei: z.string().min(15).max(17).regex(/^\d+$/, 'IMEI hanya boleh angka'),
  model: z.string().max(50).optional(),
  organizationId: z.string().uuid().optional(),
});
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

// ─── Update Device ───────────────────────────────────
export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  model: z.string().max(50).optional(),
  organizationId: z.string().uuid().nullable().optional(),
});
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

// ─── Import Devices (bulk) ───────────────────────────
export const importDevicesSchema = z.object({
  imeis: z.array(z.string().min(15).max(17)).min(1).max(100),
});
export type ImportDevicesInput = z.infer<typeof importDevicesSchema>;

// ─── Device Query Filters ────────────────────────────
export const deviceQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  groupId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type DeviceQueryInput = z.infer<typeof deviceQuerySchema>;

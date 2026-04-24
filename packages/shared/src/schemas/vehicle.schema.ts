import { z } from 'zod';
import { VEHICLE_TYPES } from '../types/enums';

// ─── Create Vehicle ──────────────────────────────────
export const createVehicleSchema = z.object({
  plateNo: z.string().min(1).max(20),
  type: z.enum(VEHICLE_TYPES).default('car'),
  maxSpeed: z.number().int().positive().max(300).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  vin: z.string().max(17).optional(),
  deviceId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  insuranceExpiry: z.string().datetime().optional(),
});
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// ─── Update Vehicle ──────────────────────────────────
export const updateVehicleSchema = z.object({
  plateNo: z.string().min(1).max(20).optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  maxSpeed: z.number().int().positive().max(300).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  vin: z.string().max(17).optional(),
  deviceId: z.string().uuid().nullable().optional(),
  insuranceExpiry: z.string().datetime().nullable().optional(),
});
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// ─── Vehicle Query Filters ───────────────────────────
export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;

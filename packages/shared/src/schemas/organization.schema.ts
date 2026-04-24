import { z } from 'zod';
import { ORG_PLANS } from '../types/enums';

// ─── Create Organization ─────────────────────────────
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan dash'),
  plan: z.enum(ORG_PLANS).default('free'),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// ─── Update Organization ─────────────────────────────
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(ORG_PLANS).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

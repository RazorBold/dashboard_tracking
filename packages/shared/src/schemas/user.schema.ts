import { z } from 'zod';
import { USER_ROLES } from '../types/enums';

// ─── Create User ─────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(USER_ROLES).default('viewer'),
  organizationId: z.string().uuid().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ─── Update User ─────────────────────────────────────
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(USER_ROLES).optional(),
  avatar: z.string().url().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── Change Password ─────────────────────────────────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(128),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

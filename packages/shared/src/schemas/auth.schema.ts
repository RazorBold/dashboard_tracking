import { z } from 'zod';

// ─── Login ───────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Register ────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(128),
  organizationName: z.string().min(2, 'Nama organisasi minimal 2 karakter').max(100).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Refresh Token ───────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ─── Auth Response ───────────────────────────────────
export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    avatar: z.string().nullable(),
    organizationId: z.string().nullable(),
  }),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import type { User } from '../db/schema';
import { env, logger } from '../config';
import { AppError } from '../middleware';
import type { JwtPayload } from '../middleware';

const SALT_ROUNDS = 12;

import crypto from 'crypto';

// ─── Helper: Generate Access Token ───────────────────
const generateAccessToken = (user: User): string => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    orgId: user.organizationId ?? null,
    jti: crypto.randomUUID(),
  } as any;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// ─── Helper: Generate Refresh Token ──────────────────
const generateRefreshToken = (user: User): string => {
  return jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// ─── Helper: Save Refresh Token to DB ────────────────
const saveRefreshToken = async (
  userId: string,
  token: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.insert(refreshTokens).values({
    userId,
    token,
    userAgent: userAgent ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt,
  });
};

// ─── Helper: Safe user response (no passwordHash) ────
const sanitizeUser = (user: User): Omit<User, 'passwordHash'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
};

// ═══════════════════════════════════════════════════════
// AUTH SERVICE METHODS
// ═══════════════════════════════════════════════════════

// ─── Register ─────────────────────────────────────────
export const register = async (input: {
  email: string;
  password: string;
  name: string;
}) => {
  const { email, password, name } = input;

  // Check duplicate email
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'viewer',
    })
    .returning();

  logger.info({ userId: newUser.id, email: newUser.email }, 'New user registered');
  return sanitizeUser(newUser);
};

// ─── Login ────────────────────────────────────────────
export const login = async (
  input: { email: string; password: string },
  meta: { userAgent?: string; ipAddress?: string },
) => {
  const { email, password } = input;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await saveRefreshToken(user.id, refreshToken, meta.userAgent, meta.ipAddress);

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── Refresh Access Token ─────────────────────────────
export const refresh = async (token: string) => {
  // Verify refresh token signature
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  // Check if token exists and is not expired
  const stored = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.token, token),
      gt(refreshTokens.expiresAt, new Date()),
    ),
  });

  if (!stored) {
    throw new AppError(401, 'Refresh token not found or expired');
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  });

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  const newAccessToken = generateAccessToken(user);

  logger.info({ userId: user.id }, 'Access token refreshed');

  return {
    accessToken: newAccessToken,
    user: sanitizeUser(user),
  };
};

// ─── Logout ───────────────────────────────────────────
export const logout = async (token: string): Promise<void> => {
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.token, token));

  logger.info('User logged out, refresh token invalidated');
};

// ─── Logout All Sessions ──────────────────────────────
export const logoutAll = async (userId: string): Promise<void> => {
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.userId, userId));

  logger.info({ userId }, 'All sessions revoked');
};

// ─── Get Me (current user) ────────────────────────────
export const getMe = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return sanitizeUser(user);
};

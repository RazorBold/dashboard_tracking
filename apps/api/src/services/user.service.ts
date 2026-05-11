import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { User } from '../db/schema';
import { AppError } from '../middleware';

const SALT_ROUNDS = 10;

type SafeUser = Omit<User, 'passwordHash'>;

const sanitize = (u: User): SafeUser => {
  const { passwordHash, ...safe } = u;
  return safe;
};

export async function listOrgUsers(orgId: string): Promise<SafeUser[]> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, orgId))
    .orderBy(users.createdAt);
  return rows.map(sanitize);
}

export async function createOrgUser(
  orgId: string,
  input: { name: string; email: string; password: string; role?: User['role'] },
): Promise<SafeUser> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length > 0) throw new AppError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const [user] = await db.insert(users).values({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? 'viewer',
    organizationId: orgId,
  }).returning();

  return sanitize(user);
}

export async function updateOrgUser(
  orgId: string,
  userId: string,
  input: { name?: string; role?: User['role']; password?: string },
): Promise<SafeUser> {
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
    .limit(1);

  if (!existing) throw new AppError(404, 'User not found in your organization');

  const updates: Partial<User> = { updatedAt: new Date() };
  if (input.name) updates.name = input.name;
  if (input.role) updates.role = input.role;
  if (input.password) updates.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  return sanitize(updated);
}

export async function deleteOrgUser(orgId: string, userId: string): Promise<void> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
    .limit(1);

  if (!existing) throw new AppError(404, 'User not found in your organization');

  await db.delete(users).where(eq(users.id, userId));
}

export async function getOrgStats(orgId: string) {
  const { devices, vehicles } = await import('../db/schema');

  const [deviceCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devices)
    .where(eq(devices.organizationId, orgId));

  const [vehicleCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(eq(vehicles.organizationId, orgId));

  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.organizationId, orgId));

  return {
    devices: deviceCount?.count ?? 0,
    vehicles: vehicleCount?.count ?? 0,
    users: userCount?.count ?? 0,
  };
}

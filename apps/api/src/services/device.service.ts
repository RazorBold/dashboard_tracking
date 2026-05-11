import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { devices } from '../db/schema';
import type { Device, NewDevice } from '../db/schema';
import { AppError } from '../middleware';

export interface ListDevicesParams {
  page: number;
  limit: number;
  search?: string;
  status?: Device['status'];
  groupId?: string;
  orgId?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Compute device status from lastOnline + expiresAt timestamps
export function computeDeviceStatus(
  lastOnline: Date | null | undefined,
  expiresAt: Date | null | undefined,
): Device['status'] {
  const now = new Date();
  if (expiresAt && expiresAt < now) return 'expired';
  if (!lastOnline) return 'offline';
  const ms = now.getTime() - new Date(lastOnline).getTime();
  if (ms < 60 * 60 * 1000) return 'online';         // < 1 hour
  if (ms < 24 * 60 * 60 * 1000) return 'inactive';  // 1-24 hours
  return 'offline';                                   // > 24 hours
}

export async function listDevices(params: ListDevicesParams): Promise<PaginatedResult<Device>> {
  const { page, limit, search, status, groupId, orgId } = params;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (orgId) conditions.push(eq(devices.organizationId, orgId));
  if (groupId) conditions.push(eq(devices.groupId, groupId));
  if (search) {
    conditions.push(
      or(
        ilike(devices.name, `%${search}%`),
        ilike(devices.imei, `%${search}%`),
      )!,
    );
  }
  // Filter by computed status (based on lastOnline + expiresAt) — not stored enum
  if (status === 'expired') {
    conditions.push(sql`${devices.expiresAt} IS NOT NULL AND ${devices.expiresAt} < now()` as any);
  } else if (status === 'online') {
    conditions.push(sql`${devices.lastOnline} IS NOT NULL AND ${devices.lastOnline} > now() - interval '1 hour'` as any);
  } else if (status === 'inactive') {
    conditions.push(sql`${devices.lastOnline} IS NOT NULL AND ${devices.lastOnline} > now() - interval '1 day' AND ${devices.lastOnline} <= now() - interval '1 hour'` as any);
  } else if (status === 'offline') {
    conditions.push(sql`(${devices.lastOnline} IS NULL OR ${devices.lastOnline} <= now() - interval '1 day')` as any);
    conditions.push(sql`(${devices.expiresAt} IS NULL OR ${devices.expiresAt} >= now())` as any);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(devices)
    .where(whereClause)
    .orderBy(devices.createdAt)
    .limit(limit)
    .offset(offset);

  // Total count (reuse same filter but without pagination)
  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devices)
    .where(whereClause);

  const total = countRows[0]?.count ?? 0;

  return {
    data: rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const rows = await db.select().from(devices).where(eq(devices.id, id)).limit(1).offset(0);
  return rows[0] ?? null;
}

export async function createDevice(
  input: Omit<NewDevice, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Device> {
  try {
    const rows = await db.insert(devices).values(input).returning();
    return rows[0];
  } catch (err: any) {
    if (err?.code === '23505' && err?.detail?.includes('imei')) {
      throw new AppError(409, `Device with IMEI ${input.imei} already exists`);
    }
    throw err;
  }
}

export async function updateDevice(
  id: string,
  input: Partial<Omit<NewDevice, 'id' | 'createdAt'>>,
): Promise<Device> {
  const rows = await db
    .update(devices)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(devices.id, id))
    .returning();

  if (rows.length === 0) throw new AppError(404, `Device ${id} not found`);
  return rows[0];
}

export async function deleteDevice(id: string): Promise<Device> {
  const rows = await db.delete(devices).where(eq(devices.id, id)).returning();
  if (rows.length === 0) throw new AppError(404, `Device ${id} not found`);
  return rows[0];
}

export async function exportDevicesCsv(params: Omit<ListDevicesParams, 'page' | 'limit'>): Promise<string> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (params.status) conditions.push(eq(devices.status, params.status));
  if (params.groupId) conditions.push(eq(devices.groupId, params.groupId));
  if (params.search) {
    conditions.push(or(ilike(devices.name, `%${params.search}%`), ilike(devices.imei, `%${params.search}%`))!);
  }

  const rows = await db
    .select()
    .from(devices)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(devices.createdAt)
    .limit(10000)
    .offset(0);

  const header = ['ID', 'Name', 'IMEI', 'Model', 'Status', 'Activated At', 'Expires At', 'Created At'];
  const csvRows = rows.map((d) =>
    [
      d.id,
      d.name,
      d.imei,
      d.model ?? '',
      d.status,
      d.activatedAt?.toISOString() ?? '',
      d.expiresAt?.toISOString() ?? '',
      d.createdAt.toISOString(),
    ].join(','),
  );

  return [header.join(','), ...csvRows].join('\n');
}

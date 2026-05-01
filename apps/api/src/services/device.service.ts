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

export async function listDevices(params: ListDevicesParams): Promise<PaginatedResult<Device>> {
  const { page, limit, search, status, groupId, orgId } = params;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (orgId) conditions.push(eq(devices.organizationId, orgId));
  if (status) conditions.push(eq(devices.status, status));
  if (groupId) conditions.push(eq(devices.groupId, groupId));
  if (search) {
    conditions.push(
      or(
        ilike(devices.name, `%${search}%`),
        ilike(devices.imei, `%${search}%`),
      )!,
    );
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

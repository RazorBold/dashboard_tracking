import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { vehicles } from '../db/schema';
import type { Vehicle, NewVehicle } from '../db/schema';
import { AppError } from '../middleware';

export interface ListVehiclesParams {
  page: number;
  limit: number;
  search?: string;
  status?: Vehicle['status'];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listVehicles(params: ListVehiclesParams): Promise<PaginatedResult<Vehicle>> {
  const { page, limit, search, status } = params;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(vehicles.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(vehicles.plateNo, `%${search}%`),
        ilike(vehicles.ownerName, `%${search}%`),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(vehicles)
    .where(whereClause)
    .orderBy(vehicles.createdAt)
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(whereClause);

  const total = countRows[0]?.count ?? 0;

  return {
    data: rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1).offset(0);
  return rows[0] ?? null;
}

export async function createVehicle(
  input: Omit<NewVehicle, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Vehicle> {
  const rows = await db.insert(vehicles).values(input).returning();
  return rows[0];
}

export async function updateVehicle(
  id: string,
  input: Partial<Omit<NewVehicle, 'id' | 'createdAt'>>,
): Promise<Vehicle> {
  const rows = await db
    .update(vehicles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(vehicles.id, id))
    .returning();

  if (rows.length === 0) throw new AppError(404, `Vehicle ${id} not found`);
  return rows[0];
}

export async function deleteVehicle(id: string): Promise<Vehicle> {
  const rows = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
  if (rows.length === 0) throw new AppError(404, `Vehicle ${id} not found`);
  return rows[0];
}

export async function bindDevice(vehicleId: string, deviceId: string): Promise<Vehicle> {
  const rows = await db
    .update(vehicles)
    .set({ deviceId, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicleId))
    .returning();

  if (rows.length === 0) throw new AppError(404, `Vehicle ${vehicleId} not found`);
  return rows[0];
}

export async function unbindDevice(vehicleId: string): Promise<Vehicle> {
  const rows = await db
    .update(vehicles)
    .set({ deviceId: null, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicleId))
    .returning();

  if (rows.length === 0) throw new AppError(404, `Vehicle ${vehicleId} not found`);
  return rows[0];
}

export async function exportVehiclesCsv(params: Omit<ListVehiclesParams, 'page' | 'limit'>): Promise<string> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (params.status) conditions.push(eq(vehicles.status, params.status));
  if (params.search) {
    conditions.push(or(ilike(vehicles.plateNo, `%${params.search}%`), ilike(vehicles.ownerName, `%${params.search}%`))!);
  }

  const rows = await db
    .select()
    .from(vehicles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(vehicles.createdAt)
    .limit(10000)
    .offset(0);

  const header = ['ID', 'Plate No', 'Type', 'Make', 'Model', 'Max Speed', 'Device ID', 'Status', 'Insurance Status', 'Owner'];
  const csvRows = rows.map((v) =>
    [v.id, v.plateNo, v.type, v.make ?? '', v.model ?? '', v.maxSpeed ?? '', v.deviceId ?? '', v.status, v.insuranceStatus, v.ownerName ?? ''].join(','),
  );

  return [header.join(','), ...csvRows].join('\n');
}

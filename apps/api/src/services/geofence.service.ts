import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { geofences } from '../db/schema';
import type { Geofence, NewGeofence } from '../db/schema';

export type GeofenceGeometry =
  | { center: { lat: number; lng: number }; radius: number }
  | { points: { lat: number; lng: number }[] };

export interface GeofencePayload {
  name: string;
  type: 'circle' | 'polygon';
  geometry: GeofenceGeometry;
  description?: string | null;
  assignedDeviceIds?: string[];
}

export async function listGeofences(orgId: string): Promise<Geofence[]> {
  return db
    .select()
    .from(geofences)
    .where(eq(geofences.organizationId, orgId))
    .orderBy(desc(geofences.createdAt));
}

export async function createGeofence(payload: GeofencePayload, orgId: string): Promise<Geofence> {
  const [row] = await db
    .insert(geofences)
    .values({
      name: payload.name,
      type: payload.type,
      geometry: payload.geometry as any,
      organizationId: orgId,
      description: payload.description ?? null,
      assignedDeviceIds: payload.assignedDeviceIds ?? [],
    })
    .returning();
  return row;
}

export async function updateGeofence(
  id: string,
  payload: Partial<GeofencePayload>,
  orgId: string,
): Promise<Geofence | null> {
  const updates: Partial<NewGeofence> = { updatedAt: new Date() };
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description ?? null;
  if (payload.geometry !== undefined) updates.geometry = payload.geometry as any;
  if (payload.assignedDeviceIds !== undefined) updates.assignedDeviceIds = payload.assignedDeviceIds;

  const rows = await db
    .update(geofences)
    .set(updates)
    .where(and(eq(geofences.id, id), eq(geofences.organizationId, orgId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteGeofence(id: string, orgId: string): Promise<boolean> {
  const rows = await db
    .delete(geofences)
    .where(and(eq(geofences.id, id), eq(geofences.organizationId, orgId)))
    .returning({ id: geofences.id });
  return rows.length > 0;
}

// ─── Point-in-geofence check (for alert triggers) ────
export function isPointInGeofence(lat: number, lng: number, fence: Geofence): boolean {
  const geo = fence.geometry as any;
  if (fence.type === 'circle') {
    const { center, radius } = geo as { center: { lat: number; lng: number }; radius: number };
    return haversineMeters(lat, lng, center.lat, center.lng) <= radius;
  }
  // polygon — ray casting
  const { points } = geo as { points: { lat: number; lng: number }[] };
  return pointInPolygon(lat, lng, points);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lat: number, lng: number, points: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng, yi = points[i].lat;
    const xj = points[j].lng, yj = points[j].lat;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

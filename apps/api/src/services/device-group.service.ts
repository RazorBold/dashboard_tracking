import { eq } from 'drizzle-orm';
import { db } from '../db';
import { deviceGroups, devices } from '../db/schema';
import type { DeviceGroup, NewDeviceGroup } from '../db/schema';
import { AppError } from '../middleware';

export async function listDeviceGroups(): Promise<DeviceGroup[]> {
  return db.select().from(deviceGroups).orderBy(deviceGroups.name).limit(1000).offset(0);
}

export async function createDeviceGroup(
  input: Omit<NewDeviceGroup, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<DeviceGroup> {
  const rows = await db.insert(deviceGroups).values(input).returning();
  return rows[0];
}

export async function updateDeviceGroup(
  id: string,
  input: Partial<Omit<NewDeviceGroup, 'id' | 'createdAt'>>,
): Promise<DeviceGroup> {
  const rows = await db
    .update(deviceGroups)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(deviceGroups.id, id))
    .returning();

  if (rows.length === 0) throw new AppError(404, `Device group ${id} not found`);
  return rows[0];
}

export async function deleteDeviceGroup(id: string): Promise<DeviceGroup> {
  // Unassign all devices from this group first
  await db
    .update(devices)
    .set({ groupId: null, updatedAt: new Date() })
    .where(eq(devices.groupId, id))
    .returning();

  const rows = await db.delete(deviceGroups).where(eq(deviceGroups.id, id)).returning();
  if (rows.length === 0) throw new AppError(404, `Device group ${id} not found`);
  return rows[0];
}

export async function assignDevicesToGroup(
  groupId: string,
  deviceIds: string[],
): Promise<{ assigned: number }> {
  let assigned = 0;
  for (const deviceId of deviceIds) {
    const rows = await db
      .update(devices)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(devices.id, deviceId))
      .returning();
    if (rows.length > 0) assigned++;
  }
  return { assigned };
}

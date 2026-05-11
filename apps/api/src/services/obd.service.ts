import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../db';
import { devices, obdSnapshots, obdDtcs } from '../db/schema';
import type { ObdSnapshot, ObdDtc } from '../db/schema';
import { logger } from '../config/logger';

// ─── Incoming payload interfaces ─────────────────────

export interface ObdPayload {
  timestamp?: string;
  rpm?: number;
  engineLoad?: number;
  coolantTemp?: number;
  intakeTemp?: number;
  throttle?: number;
  timingAdvance?: number;
  mafRate?: number;
  fuelLevel?: number;
  fuelPressure?: number;
  shortFuelTrim?: number;
  longFuelTrim?: number;
  vehicleSpeed?: number;
  odometer?: number;
  batteryVoltage?: number;
  o2Voltage?: number;
}

export interface DtcCode {
  code: string;
  description?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface DtcPayload {
  action: 'detected' | 'cleared';
  codes: DtcCode[];
}

// ─── Resolve device by IMEI ───────────────────────────

async function findDeviceByImei(imei: string) {
  const [device] = await db
    .select({ id: devices.id })
    .from(devices)
    .where(eq(devices.imei, imei))
    .limit(1);
  return device ?? null;
}

// ─── Process incoming OBD snapshot ────────────────────

export async function processIncomingObd(imei: string, payload: ObdPayload): Promise<void> {
  const device = await findDeviceByImei(imei);
  if (!device) {
    logger.warn({ imei }, 'OBD snapshot received for unknown IMEI');
    return;
  }

  await db.insert(obdSnapshots).values({
    deviceId:      device.id,
    imei,
    timestamp:     payload.timestamp ? new Date(payload.timestamp) : new Date(),
    rpm:           payload.rpm           ?? null,
    engineLoad:    payload.engineLoad    != null ? String(payload.engineLoad)    : null,
    coolantTemp:   payload.coolantTemp   ?? null,
    intakeTemp:    payload.intakeTemp    ?? null,
    throttle:      payload.throttle      != null ? String(payload.throttle)      : null,
    timingAdvance: payload.timingAdvance != null ? String(payload.timingAdvance) : null,
    mafRate:       payload.mafRate       != null ? String(payload.mafRate)       : null,
    fuelLevel:     payload.fuelLevel     != null ? String(payload.fuelLevel)     : null,
    fuelPressure:  payload.fuelPressure  ?? null,
    shortFuelTrim: payload.shortFuelTrim != null ? String(payload.shortFuelTrim) : null,
    longFuelTrim:  payload.longFuelTrim  != null ? String(payload.longFuelTrim)  : null,
    vehicleSpeed:  payload.vehicleSpeed  ?? null,
    odometer:      payload.odometer      ?? null,
    batteryVoltage:payload.batteryVoltage!= null ? String(payload.batteryVoltage): null,
    o2Voltage:     payload.o2Voltage     != null ? String(payload.o2Voltage)     : null,
  });

  logger.debug({ imei }, 'OBD snapshot saved');
}

// ─── Process incoming DTC event ───────────────────────

export async function processIncomingDtc(imei: string, payload: DtcPayload): Promise<void> {
  const device = await findDeviceByImei(imei);
  if (!device) {
    logger.warn({ imei }, 'DTC event received for unknown IMEI');
    return;
  }

  const now = new Date();

  if (payload.action === 'detected') {
    for (const dtc of payload.codes) {
      // Upsert: if code already active, update detectedAt; otherwise insert
      const [existing] = await db
        .select({ id: obdDtcs.id })
        .from(obdDtcs)
        .where(and(
          eq(obdDtcs.deviceId, device.id),
          eq(obdDtcs.code, dtc.code),
          eq(obdDtcs.status, 'active'),
        ))
        .limit(1);

      if (!existing) {
        await db.insert(obdDtcs).values({
          deviceId:    device.id,
          imei,
          code:        dtc.code,
          description: dtc.description ?? null,
          severity:    dtc.severity ?? 'warning',
          status:      'active',
          detectedAt:  now,
        });
      }
    }
    logger.info({ imei, count: payload.codes.length }, 'DTC codes detected');
  } else if (payload.action === 'cleared') {
    const codes = payload.codes.map((c) => c.code);
    await db.update(obdDtcs)
      .set({ status: 'cleared', clearedAt: now })
      .where(and(
        eq(obdDtcs.deviceId, device.id),
        eq(obdDtcs.status, 'active'),
        inArray(obdDtcs.code, codes),
      ));
    logger.info({ imei, codes }, 'DTC codes cleared');
  }
}

// ─── Query helpers (used by routes) ──────────────────

export async function getLatestSnapshot(deviceId: string): Promise<ObdSnapshot | null> {
  const [row] = await db
    .select()
    .from(obdSnapshots)
    .where(eq(obdSnapshots.deviceId, deviceId))
    .orderBy(desc(obdSnapshots.timestamp))
    .limit(1);
  return row ?? null;
}

export interface SnapshotHistoryParams {
  deviceId: string;
  from: Date;
  to: Date;
  limit?: number;
}

export async function getSnapshotHistory(params: SnapshotHistoryParams): Promise<ObdSnapshot[]> {
  return db
    .select()
    .from(obdSnapshots)
    .where(and(
      eq(obdSnapshots.deviceId, params.deviceId),
      gte(obdSnapshots.timestamp, params.from),
      lte(obdSnapshots.timestamp, params.to),
    ))
    .orderBy(desc(obdSnapshots.timestamp))
    .limit(params.limit ?? 500);
}

export async function getActiveDtcs(deviceId: string): Promise<ObdDtc[]> {
  return db
    .select()
    .from(obdDtcs)
    .where(and(eq(obdDtcs.deviceId, deviceId), eq(obdDtcs.status, 'active')))
    .orderBy(desc(obdDtcs.detectedAt));
}

export async function getDtcHistory(deviceId: string, limit = 100): Promise<ObdDtc[]> {
  return db
    .select()
    .from(obdDtcs)
    .where(eq(obdDtcs.deviceId, deviceId))
    .orderBy(desc(obdDtcs.detectedAt))
    .limit(limit);
}

export async function clearDtc(id: string, deviceId: string): Promise<ObdDtc | null> {
  const [updated] = await db.update(obdDtcs)
    .set({ status: 'cleared', clearedAt: new Date() })
    .where(and(eq(obdDtcs.id, id), eq(obdDtcs.deviceId, deviceId)))
    .returning();
  return updated ?? null;
}

export async function clearAllDtcs(deviceId: string): Promise<number> {
  const rows = await db.update(obdDtcs)
    .set({ status: 'cleared', clearedAt: new Date() })
    .where(and(eq(obdDtcs.deviceId, deviceId), eq(obdDtcs.status, 'active')))
    .returning({ id: obdDtcs.id });
  return rows.length;
}

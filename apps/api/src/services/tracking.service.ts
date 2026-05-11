import { db } from '../db';
import { devices, devicePositions } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';
import { broadcastLocation } from '../config/websocket';

import { detectAlerts } from './alert.service';

export interface LocationPayload {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  satellites?: number;
  gsmSignal?: number;
  batteryVoltage?: number;
  accStatus?: number | boolean;
  mileage?: number;
  timestamp: string; // ISO String
}

export const processIncomingLocation = async (imei: string, payload: LocationPayload) => {
  try {
    // 1. Find device by IMEI
    const device = await db.query.devices.findFirst({
      where: eq(devices.imei, imei),
      with: { vehicle: true },
    });

    if (!device) {
      logger.warn({ imei }, 'Received location for unknown device');
      return;
    }

    const timestamp = new Date(payload.timestamp);

    // 1.5. Fetch previous position from Redis to detect alerts
    const previousPositionRaw = await redisClient.get(`device:${device.id}:position`);
    const previousPosition = previousPositionRaw ? JSON.parse(previousPositionRaw) : null;

    // Call detectAlerts asynchronously (don't await to avoid blocking)
    detectAlerts(device as any, device.vehicle as any, previousPosition, {
      lat: payload.lat,
      lng: payload.lng,
      speed: payload.speed ?? 0,
      heading: payload.heading,
      altitude: payload.altitude,
      acc: typeof payload.accStatus === 'boolean' ? payload.accStatus : payload.accStatus === 1,
      timestamp: payload.timestamp,
    }).catch(err => {
      logger.error({ err, deviceId: device.id }, 'Alert detection failed');
    });

    // 2. Insert into PostgreSQL
    await db.insert(devicePositions).values({
      deviceId: device.id,
      latitude: payload.lat,
      longitude: payload.lng,
      speed: payload.speed ?? 0,
      heading: payload.heading ?? 0,
      altitude: payload.altitude,
      satellites: payload.satellites,
      gsmSignal: payload.gsmSignal,
      batteryVoltage: payload.batteryVoltage,
      accStatus: typeof payload.accStatus === 'boolean' ? (payload.accStatus ? 1 : 0) : payload.accStatus,
      mileage: payload.mileage,
      timestamp,
    });

    // 3. Update device lastOnline + mark online
    await db.update(devices)
      .set({ lastOnline: new Date(), status: 'online' })
      .where(eq(devices.id, device.id));

    // 4. Save latest to Redis
    const positionData = {
      ...payload,
      deviceId: device.id,
      timestamp: timestamp.toISOString()
    };

    await redisClient.set(
      `device:${device.id}:position`,
      JSON.stringify(positionData),
      'EX',
      86400 // Cache for 1 day
    );

    broadcastLocation(positionData);
  } catch (err) {
    logger.error({ err, imei }, 'Failed to process incoming location');
  }
};

export const getLatestPosition = async (deviceId: string) => {
  const cached = await redisClient.get(`device:${deviceId}:position`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fallback to database
  const position = await db.query.devicePositions.findFirst({
    where: eq(devicePositions.deviceId, deviceId),
    orderBy: (pos, { desc }) => [desc(pos.timestamp)],
  });

  return position || null;
};

export interface LatestPosition {
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  altitude?: number;
  satellites?: number;
  gsmSignal?: number;
  timestamp?: string;
}

export const getLatestPositions = async (
  deviceIds: string[],
): Promise<Record<string, LatestPosition>> => {
  if (deviceIds.length === 0) return {};

  const result: Record<string, LatestPosition> = {};

  await Promise.all(
    deviceIds.map(async (id) => {
      try {
        const cached = await redisClient.get(`device:${id}:position`);
        if (cached) {
          const pos = JSON.parse(cached);
          result[id] = {
            lat: pos.lat,
            lng: pos.lng,
            speed: pos.speed ?? 0,
            heading: pos.heading,
            altitude: pos.altitude,
            satellites: pos.satellites,
            gsmSignal: pos.gsmSignal,
            timestamp: pos.timestamp,
          };
          return;
        }
        const pos = await db.query.devicePositions.findFirst({
          where: eq(devicePositions.deviceId, id),
          orderBy: (p, { desc: d }) => [d(p.timestamp)],
        });
        if (pos) {
          result[id] = {
            lat: pos.latitude,
            lng: pos.longitude,
            speed: pos.speed ?? 0,
            heading: pos.heading ?? undefined,
            altitude: pos.altitude ?? undefined,
            satellites: pos.satellites ?? undefined,
            gsmSignal: pos.gsmSignal ?? undefined,
            timestamp: pos.timestamp.toISOString(),
          };
        }
      } catch {
        // skip this device on error
      }
    }),
  );

  return result;
};

export const getPositionHistory = async (deviceId: string, from: Date, to: Date) => {
  return await db.query.devicePositions.findMany({
    where: and(
      eq(devicePositions.deviceId, deviceId),
      gte(devicePositions.timestamp, from),
      lte(devicePositions.timestamp, to)
    ),
    orderBy: (pos, { asc }) => [asc(pos.timestamp)],
  });
};

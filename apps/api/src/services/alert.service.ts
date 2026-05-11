import { db } from '../db';
import { alerts, devices } from '../db/schema';
import { type Device } from '../db/schema/devices';
import { type Vehicle } from '../db/schema/vehicles';
import { eq } from 'drizzle-orm';
import { logger } from '../config/logger';
import { broadcastAlert } from '../config/websocket';

export interface PositionPayload {
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  altitude?: number;
  acc?: boolean;
  timestamp?: string;
}

export async function detectAlerts(
  device: Device,
  vehicle: Vehicle | null,
  previousPosition: PositionPayload | null,
  currentPosition: PositionPayload
) {
  if (!device.organizationId) return;

  const newAlerts: any[] = [];

  // 1. Overspeed Alert
  if (vehicle && vehicle.maxSpeed && currentPosition.speed > vehicle.maxSpeed) {
    // Basic threshold. In real-world, we might require speed > maxSpeed for X seconds.
    // For now, if current is overspeed, trigger warning.
    // To prevent spam, we could check if previous was also overspeed.
    const wasOverspeeding = previousPosition ? previousPosition.speed > vehicle.maxSpeed : false;
    
    if (!wasOverspeeding) {
      newAlerts.push({
        deviceId: device.id,
        organizationId: device.organizationId,
        type: 'overspeed',
        severity: 'warning',
        message: `Vehicle exceeded speed limit: ${currentPosition.speed.toFixed(1)} km/h (Limit: ${vehicle.maxSpeed} km/h)`,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        speed: currentPosition.speed,
      });
    }
  }

  // 2. ACC Status Alert
  if (previousPosition && previousPosition.acc !== undefined && currentPosition.acc !== undefined) {
    if (previousPosition.acc === false && currentPosition.acc === true) {
      newAlerts.push({
        deviceId: device.id,
        organizationId: device.organizationId,
        type: 'acc_on',
        severity: 'info',
        message: `Engine turned ON`,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        speed: currentPosition.speed,
      });
    } else if (previousPosition.acc === true && currentPosition.acc === false) {
      newAlerts.push({
        deviceId: device.id,
        organizationId: device.organizationId,
        type: 'acc_off',
        severity: 'info',
        message: `Engine turned OFF`,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        speed: currentPosition.speed,
      });
    }
  }

  // 3. Geofence Alerts (Placeholder for future implementation)
  // ...

  // Insert and broadcast alerts
  for (const alertData of newAlerts) {
    try {
      const [inserted] = await db.insert(alerts).values(alertData).returning();
      broadcastAlert(inserted);
    } catch (error) {
      logger.error({ error, deviceId: device.id }, 'Failed to save alert');
    }
  }
}

// ─── Alert types that come directly from device hardware ─────────────────────
export type DeviceAlertType =
  | 'sos' | 'vibration' | 'collision'
  | 'sharp_turn_left' | 'sharp_turn_right'
  | 'sudden_acceleration' | 'sudden_deceleration'
  | 'low_battery';

export interface DeviceAlertPayload {
  type: DeviceAlertType;
  lat?: number;
  lng?: number;
  speed?: number;
  timestamp?: string;
}

const SEVERITY_MAP: Record<DeviceAlertType, 'info' | 'warning' | 'critical'> = {
  sos:                  'critical',
  collision:            'critical',
  vibration:            'warning',
  sharp_turn_left:      'warning',
  sharp_turn_right:     'warning',
  sudden_acceleration:  'warning',
  sudden_deceleration:  'warning',
  low_battery:          'warning',
};

const MESSAGE_MAP: Record<DeviceAlertType, string> = {
  sos:                  'SOS button pressed — immediate assistance required',
  collision:            'Possible collision detected',
  vibration:            'Abnormal vibration detected',
  sharp_turn_left:      'Sharp left turn detected',
  sharp_turn_right:     'Sharp right turn detected',
  sudden_acceleration:  'Sudden acceleration detected',
  sudden_deceleration:  'Sudden deceleration / hard braking detected',
  low_battery:          'Low battery voltage detected',
};

const VALID_DEVICE_ALERT_TYPES = new Set<string>(Object.keys(SEVERITY_MAP));

export async function processIncomingAlert(imei: string, payload: DeviceAlertPayload): Promise<void> {
  if (!VALID_DEVICE_ALERT_TYPES.has(payload.type)) {
    logger.warn({ imei, type: payload.type }, 'Unknown device alert type — ignored');
    return;
  }

  const device = await db.query.devices.findFirst({
    where: eq(devices.imei, imei),
  });

  if (!device) {
    logger.warn({ imei }, 'Device alert received for unknown IMEI');
    return;
  }

  if (!device.organizationId) {
    logger.warn({ imei }, 'Device has no organization — alert skipped');
    return;
  }

  const [inserted] = await db.insert(alerts).values({
    deviceId:       device.id,
    organizationId: device.organizationId,
    type:           payload.type as any,
    severity:       SEVERITY_MAP[payload.type],
    message:        MESSAGE_MAP[payload.type],
    latitude:       payload.lat  ?? null,
    longitude:      payload.lng  ?? null,
    speed:          payload.speed ?? null,
  }).returning();

  broadcastAlert(inserted);
  logger.info({ imei, type: payload.type }, 'Device alert processed');
}

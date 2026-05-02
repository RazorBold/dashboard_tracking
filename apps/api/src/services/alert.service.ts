import { db } from '../db';
import { alerts } from '../db/schema';
import { type Device } from '../db/schema/devices';
import { type Vehicle } from '../db/schema/vehicles';
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
        location: { lat: currentPosition.lat, lng: currentPosition.lng },
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
        location: { lat: currentPosition.lat, lng: currentPosition.lng },
      });
    } else if (previousPosition.acc === true && currentPosition.acc === false) {
      newAlerts.push({
        deviceId: device.id,
        organizationId: device.organizationId,
        type: 'acc_off',
        severity: 'info',
        message: `Engine turned OFF`,
        location: { lat: currentPosition.lat, lng: currentPosition.lng },
      });
    }
  }

  // 3. Geofence Alerts (Placeholder for future implementation)
  // ...

  // Insert and broadcast alerts
  for (const alertData of newAlerts) {
    try {
      const [inserted] = await db.insert(alerts).values(alertData).returning();
      // Broadcast via WebSocket
      broadcastAlert(inserted);
    } catch (error) {
      logger.error({ error, deviceId: device.id }, 'Failed to save alert');
    }
  }
}

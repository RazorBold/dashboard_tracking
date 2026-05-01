import mqtt from 'mqtt';
import { env } from './env';
import { logger } from './logger';
import { processIncomingLocation } from '../services/tracking.service';
import { db } from '../db';
import { deviceCommands } from '../db/schema';
import { eq } from 'drizzle-orm';

export const mqttClient = mqtt.connect(env.MQTT_URL, {
  reconnectPeriod: 5000,
  clientId: `api-server-${Math.random().toString(16).slice(2, 8)}`,
});

mqttClient.on('connect', () => {
  logger.info('🟢 Connected to MQTT Broker');

  mqttClient.subscribe('device/+/position', (err) => {
    if (err) {
      logger.error({ err }, '🔴 Failed to subscribe to topic');
    } else {
      logger.info('📡 Subscribed to topic device/+/position');
    }
  });

  mqttClient.subscribe('command/+/response', (err) => {
    if (err) {
      logger.error({ err }, '🔴 Failed to subscribe to command response topic');
    } else {
      logger.info('📡 Subscribed to topic command/+/response');
    }
  });
});

mqttClient.on('error', (err) => {
  logger.error({ err }, '🔴 MQTT connection error');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const parts = topic.split('/');

    if (parts.length === 3 && parts[0] === 'device' && parts[2] === 'position') {
      const imei = parts[1];
      const payload = JSON.parse(message.toString());
      await processIncomingLocation(imei, payload);
      return;
    }

    if (parts.length === 3 && parts[0] === 'command' && parts[2] === 'response') {
      const payload = JSON.parse(message.toString()) as {
        commandId: string;
        status: 'executed' | 'failed';
        response?: unknown;
        timestamp?: string;
      };

      if (!payload.commandId) return;

      await db.update(deviceCommands)
        .set({
          status: payload.status === 'executed' ? 'executed' : 'failed',
          response: payload.response ?? null,
          executedAt: new Date(),
        })
        .where(eq(deviceCommands.id, payload.commandId));

      logger.info({ commandId: payload.commandId, status: payload.status }, 'Command response received');
    }
  } catch (err) {
    logger.error({ err, topic, message: message.toString() }, 'Failed to parse MQTT message');
  }
});

export function publishCommand(imei: string, payload: object): void {
  mqttClient.publish(`command/${imei}/request`, JSON.stringify(payload), { qos: 1 });
}

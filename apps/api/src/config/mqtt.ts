import mqtt from 'mqtt';
import { env } from './env';
import { logger } from './logger';
import { processIncomingLocation } from '../services/tracking.service';

export const mqttClient = mqtt.connect(env.MQTT_URL, {
  reconnectPeriod: 5000,
  clientId: `api-server-${Math.random().toString(16).slice(2, 8)}`,
});

mqttClient.on('connect', () => {
  logger.info('🟢 Connected to MQTT Broker');
  
  // Subscribe to device topics
  mqttClient.subscribe('device/+/position', (err) => {
    if (err) {
      logger.error({ err }, '🔴 Failed to subscribe to topic');
    } else {
      logger.info('📡 Subscribed to topic device/+/position');
    }
  });
});

mqttClient.on('error', (err) => {
  logger.error({ err }, '🔴 MQTT connection error');
});

mqttClient.on('message', async (topic, message) => {
  try {
    // Topic format: device/{imei}/position
    const parts = topic.split('/');
    if (parts.length === 3 && parts[0] === 'device' && parts[2] === 'position') {
      const imei = parts[1];
      const payload = JSON.parse(message.toString());
      await processIncomingLocation(imei, payload);
    }
  } catch (err) {
    logger.error({ err, topic, message: message.toString() }, 'Failed to parse MQTT message');
  }
});

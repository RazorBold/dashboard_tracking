import amqplib, { type Channel, type ChannelModel } from 'amqplib';
import { env } from './env';
import { logger } from './logger';
import { processIncomingLocation } from '../services/tracking.service';
import { processIncomingAlert } from '../services/alert.service';
import { processIncomingObd, processIncomingDtc } from '../services/obd.service';
import { db } from '../db';
import { deviceCommands } from '../db/schema';
import { eq } from 'drizzle-orm';

// ─── Exchange / Queue names ────────────────────────────
const EXCHANGE      = 'amq.topic';
const POS_QUEUE     = 'iot.position.queue';
const ALERT_QUEUE   = 'iot.alert.queue';
const CMD_QUEUE     = 'iot.command.response.queue';
const OBD_QUEUE     = 'iot.obd.queue';
const DTC_QUEUE     = 'iot.dtc.queue';
const DLX          = 'iot.dlx';
const DEAD_QUEUE    = 'iot.dead.queue';

let _channel: Channel | null = null;

// ─── Connect & setup ──────────────────────────────────
export async function connectRabbitMQ(): Promise<void> {
  let connection: ChannelModel;
  try {
    connection = await amqplib.connect(env.RABBITMQ_URL);
  } catch (err) {
    logger.error({ err }, 'RabbitMQ connection failed — will not consume messages');
    return;
  }

  connection.on('error', (err) => logger.error({ err }, 'RabbitMQ connection error'));
  connection.on('close', () => logger.warn('RabbitMQ connection closed'));

  const channel = await (connection as any).createChannel();
  _channel = channel;

  // Dead-letter exchange + queue (catch failed messages for manual inspection)
  await channel.assertExchange(DLX, 'direct', { durable: true });
  await channel.assertQueue(DEAD_QUEUE, { durable: true });
  await channel.bindQueue(DEAD_QUEUE, DLX, '#');

  // Position queue — bound to amq.topic with MQTT-style routing key pattern
  await channel.assertQueue(POS_QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX, 'x-dead-letter-routing-key': 'dead.position' },
  });
  await channel.bindQueue(POS_QUEUE, EXCHANGE, 'device.#.position');

  // Alert queue — device-side events (SOS, vibration, collision, etc.)
  await channel.assertQueue(ALERT_QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX, 'x-dead-letter-routing-key': 'dead.alert' },
  });
  await channel.bindQueue(ALERT_QUEUE, EXCHANGE, 'device.#.alert');

  // OBD snapshot queue — device.{IMEI}.obd
  await channel.assertQueue(OBD_QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX, 'x-dead-letter-routing-key': 'dead.obd' },
  });
  await channel.bindQueue(OBD_QUEUE, EXCHANGE, 'device.#.obd');

  // DTC fault code queue — device.{IMEI}.dtc
  await channel.assertQueue(DTC_QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX, 'x-dead-letter-routing-key': 'dead.dtc' },
  });
  await channel.bindQueue(DTC_QUEUE, EXCHANGE, 'device.#.dtc');

  // Command response queue
  await channel.assertQueue(CMD_QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX, 'x-dead-letter-routing-key': 'dead.command' },
  });
  await channel.bindQueue(CMD_QUEUE, EXCHANGE, 'command.#.response');

  // Process 1 message at a time — prevents overload during bursts
  channel.prefetch(1);

  logger.info('RabbitMQ connected — queues ready');

  // ─── Consumer: device position ───────────────────────
  channel.consume(POS_QUEUE, async (msg: amqplib.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      // Routing key: device.{IMEI}.position
      const parts = msg.fields.routingKey.split('.');
      const imei = parts.slice(1, -1).join('.');  // handles IMEIs with dots (rare but safe)
      const payload = JSON.parse(msg.content.toString());
      await processIncomingLocation(imei, payload);
      channel.ack(msg);
    } catch (err) {
      logger.error({ err, routingKey: msg.fields.routingKey }, 'Failed to process position message');
      channel.nack(msg, false, false);  // send to DLX, do not requeue
    }
  }, { noAck: false });

  // ─── Consumer: device alert (SOS, vibration, collision, …) ─────────────────
  channel.consume(ALERT_QUEUE, async (msg: amqplib.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      // Routing key: device.{IMEI}.alert
      const parts = msg.fields.routingKey.split('.');
      const imei = parts.slice(1, -1).join('.');
      const payload = JSON.parse(msg.content.toString());
      await processIncomingAlert(imei, payload);
      channel.ack(msg);
    } catch (err) {
      logger.error({ err, routingKey: msg.fields.routingKey }, 'Failed to process alert message');
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  // ─── Consumer: OBD snapshot ──────────────────────────
  channel.consume(OBD_QUEUE, async (msg: amqplib.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const parts = msg.fields.routingKey.split('.');
      const imei  = parts.slice(1, -1).join('.');
      const payload = JSON.parse(msg.content.toString());
      await processIncomingObd(imei, payload);
      channel.ack(msg);
    } catch (err) {
      logger.error({ err, routingKey: msg.fields.routingKey }, 'Failed to process OBD message');
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  // ─── Consumer: DTC fault codes ────────────────────────
  channel.consume(DTC_QUEUE, async (msg: amqplib.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const parts = msg.fields.routingKey.split('.');
      const imei  = parts.slice(1, -1).join('.');
      const payload = JSON.parse(msg.content.toString());
      await processIncomingDtc(imei, payload);
      channel.ack(msg);
    } catch (err) {
      logger.error({ err, routingKey: msg.fields.routingKey }, 'Failed to process DTC message');
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  // ─── Consumer: command response ──────────────────────
  channel.consume(CMD_QUEUE, async (msg: amqplib.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        commandId: string;
        status: 'executed' | 'failed';
        response?: unknown;
      };

      if (!payload.commandId) { channel.ack(msg); return; }

      await db.update(deviceCommands)
        .set({
          status: payload.status === 'executed' ? 'executed' : 'failed',
          response: payload.response ?? null,
          executedAt: new Date(),
        })
        .where(eq(deviceCommands.id, payload.commandId));

      logger.info({ commandId: payload.commandId, status: payload.status }, 'Command response received');
      channel.ack(msg);
    } catch (err) {
      logger.error({ err }, 'Failed to process command response');
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}

// ─── Publish command to device via AMQP ───────────────
// RabbitMQ MQTT plugin delivers this to the device as MQTT topic command/{imei}/request
export async function publishCommand(imei: string, payload: object): Promise<void> {
  if (!_channel) {
    logger.warn({ imei }, 'RabbitMQ channel not ready — command not sent');
    return;
  }
  const routingKey = `command.${imei}.request`;
  const content = Buffer.from(JSON.stringify(payload));
  _channel.publish(EXCHANGE, routingKey, content, { persistent: true, contentType: 'application/json' });
  logger.debug({ imei, routingKey }, 'Command published to RabbitMQ');
}

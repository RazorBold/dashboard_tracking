import { randomUUID } from 'crypto';
import { db } from '../db';
import { deviceCommands } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { publishCommand } from '../config/mqtt';
import { logger } from '../config/logger';

export type CommandType = 'restart' | 'set_interval' | 'set_apn';

export interface CommandParameters {
  seconds?: number;
  apn?: string;
}

export const sendCommand = async (
  deviceId: string,
  imei: string,
  commandType: CommandType,
  parameters?: CommandParameters,
) => {
  const id = randomUUID();
  const sentAt = new Date();

  const [command] = await db.insert(deviceCommands).values({
    id,
    deviceId,
    imei,
    commandType,
    parameters: parameters ?? null,
    status: 'sent',
    sentAt,
  }).returning();

  const mqttPayload = {
    id,
    type: commandType,
    parameters: parameters ?? {},
    timestamp: sentAt.toISOString(),
  };

  publishCommand(imei, mqttPayload);

  logger.info({ commandId: id, deviceId, imei, commandType }, 'Command sent');

  return command;
};

export const getCommandHistory = async (deviceId: string, limit = 20) => {
  return db.query.deviceCommands.findMany({
    where: eq(deviceCommands.deviceId, deviceId),
    orderBy: [desc(deviceCommands.sentAt)],
    limit,
  });
};

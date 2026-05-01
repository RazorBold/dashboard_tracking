import { pgTable, uuid, varchar, text, jsonb, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Command Type Enum ───────────────────────────────
export const commandTypeEnum = pgEnum('command_type', ['restart', 'set_interval', 'set_apn']);

// ─── Command Status Enum ─────────────────────────────
export const commandStatusEnum = pgEnum('command_status', ['pending', 'sent', 'executed', 'failed']);

// ─── Device Commands Table ───────────────────────────
export const deviceCommands = pgTable('device_commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull(),
  imei: varchar('imei', { length: 17 }).notNull(),
  commandType: commandTypeEnum('command_type').notNull(),
  parameters: jsonb('parameters'),
  status: commandStatusEnum('status').default('pending').notNull(),
  response: jsonb('response'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_device_commands_device').on(table.deviceId),
  index('idx_device_commands_status').on(table.status),
  index('idx_device_commands_sent').on(table.sentAt),
]);

export type DeviceCommand = typeof deviceCommands.$inferSelect;
export type NewDeviceCommand = typeof deviceCommands.$inferInsert;

import { pgTable, uuid, doublePrecision, real, integer, smallint, timestamp, index } from 'drizzle-orm/pg-core';

// ─── Device Positions Table ──────────────────────────
// Stores GPS position history from MQTT messages
export const devicePositions = pgTable('device_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  speed: real('speed').default(0),
  heading: real('heading').default(0),
  altitude: real('altitude'),
  satellites: smallint('satellites'),
  gsmSignal: smallint('gsm_signal'),
  batteryVoltage: real('battery_voltage'),
  accStatus: smallint('acc_status'),
  mileage: real('mileage'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_positions_device').on(table.deviceId),
  index('idx_positions_timestamp').on(table.timestamp),
  index('idx_positions_device_time').on(table.deviceId, table.timestamp),
]);

export type DevicePosition = typeof devicePositions.$inferSelect;
export type NewDevicePosition = typeof devicePositions.$inferInsert;

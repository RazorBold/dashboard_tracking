
import { pgTable, uuid, varchar, text, doublePrecision, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Alert Type Enum ─────────────────────────────────
export const alertTypeEnum = pgEnum('alert_type', [
  'acc_on', 'acc_off', 'vibration', 'overspeed',
  'enter_geofence', 'exit_geofence',
  'collision', 'sharp_turn_left', 'sharp_turn_right',
  'sudden_acceleration', 'sudden_deceleration',
  'low_battery', 'sos',
]);

// ─── Alert Severity Enum ─────────────────────────────
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical']);

// ─── Alerts Table ────────────────────────────────────
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull(),
  organizationId: uuid('organization_id'),
  type: alertTypeEnum('type').notNull(),
  severity: alertSeverityEnum('severity').default('warning').notNull(),
  message: text('message'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  address: text('address'),
  speed: doublePrecision('speed'),
  isRead: boolean('is_read').default(false).notNull(),
  processedBy: uuid('processed_by'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_alerts_device').on(table.deviceId),
  index('idx_alerts_type').on(table.type),
  index('idx_alerts_read').on(table.isRead),
  index('idx_alerts_created').on(table.createdAt),
]);

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

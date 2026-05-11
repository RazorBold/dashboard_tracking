import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

export const dtcSeverityEnum = pgEnum('dtc_severity', ['critical', 'warning', 'info']);
export const dtcStatusEnum   = pgEnum('dtc_status',   ['active', 'cleared']);

export const obdDtcs = pgTable('obd_dtcs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  deviceId:    uuid('device_id').notNull(),
  imei:        varchar('imei', { length: 17 }).notNull(),
  code:        varchar('code', { length: 10 }).notNull(),  // e.g. P0300
  description: text('description'),
  severity:    dtcSeverityEnum('severity').default('warning').notNull(),
  status:      dtcStatusEnum('status').default('active').notNull(),
  detectedAt:  timestamp('detected_at', { withTimezone: true }).notNull(),
  clearedAt:   timestamp('cleared_at',  { withTimezone: true }),
  createdAt:   timestamp('created_at',  { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_obd_dtcs_device').on(t.deviceId),
  index('idx_obd_dtcs_status').on(t.status),
  index('idx_obd_dtcs_code').on(t.code),
]);

export type ObdDtc    = typeof obdDtcs.$inferSelect;
export type NewObdDtc = typeof obdDtcs.$inferInsert;

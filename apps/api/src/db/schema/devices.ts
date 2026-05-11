import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Device Status Enum ──────────────────────────────
export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'inactive', 'expired']);

// ─── Devices Table ───────────────────────────────────
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  imei: varchar('imei', { length: 17 }).unique().notNull(),
  model: varchar('model', { length: 50 }),
  status: deviceStatusEnum('status').default('offline').notNull(),
  organizationId: uuid('organization_id'),
  groupId: uuid('group_id'),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  subscriptionExpiry: timestamp('subscription_expiry', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastOnline: timestamp('last_online', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_devices_imei').on(table.imei),
  index('idx_devices_org').on(table.organizationId),
  index('idx_devices_status').on(table.status),
]);

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

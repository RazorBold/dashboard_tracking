import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Driver Status Enum ──────────────────────────────
export const driverStatusEnum = pgEnum('driver_status', ['active', 'inactive', 'suspended']);

// ─── Drivers Table ───────────────────────────────────
export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverNo: varchar('driver_no', { length: 30 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  licenseNo: varchar('license_no', { length: 30 }),
  rfidCardNo: varchar('rfid_card_no', { length: 30 }),
  kc208: varchar('kc208', { length: 30 }),
  registerPlace: varchar('register_place', { length: 100 }),
  registerDate: timestamp('register_date', { withTimezone: true }),
  licenseExpiry: timestamp('license_expiry', { withTimezone: true }),
  licenseStatus: varchar('license_status', { length: 20 }).default('N/A'),
  status: driverStatusEnum('status').default('active'),
  organizationId: uuid('organization_id'),
  fleetName: varchar('fleet_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_drivers_no').on(table.driverNo),
  index('idx_drivers_org').on(table.organizationId),
]);

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

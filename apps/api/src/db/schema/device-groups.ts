import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

// ─── Device Groups Table ─────────────────────────────
export const deviceGroups = pgTable('device_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DeviceGroup = typeof deviceGroups.$inferSelect;
export type NewDeviceGroup = typeof deviceGroups.$inferInsert;

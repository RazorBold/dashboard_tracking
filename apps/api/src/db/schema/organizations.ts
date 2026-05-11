import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ─── Organization Plan Enum ──────────────────────────
export const orgPlanEnum = pgEnum('org_plan', ['free', 'basic', 'pro', 'enterprise']);

// ─── Organizations Table ─────────────────────────────
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  plan: orgPlanEnum('plan').default('free').notNull(),
  maxDevices: varchar('max_devices', { length: 10 }).default('10'),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  address: varchar('address', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

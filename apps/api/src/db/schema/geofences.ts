import { pgTable, uuid, varchar, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ─── Geofence Type Enum ──────────────────────────────
export const geofenceTypeEnum = pgEnum('geofence_type', ['circle', 'polygon']);

// ─── Geofences Table ─────────────────────────────────
export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: geofenceTypeEnum('type').notNull(),
  // For circle: { center: { lat, lng }, radius: number }
  // For polygon: { points: [{ lat, lng }, ...] }
  geometry: jsonb('geometry').notNull(),
  organizationId: uuid('organization_id'),
  description: text('description'),
  assignedDeviceIds: jsonb('assigned_device_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Geofence = typeof geofences.$inferSelect;
export type NewGeofence = typeof geofences.$inferInsert;

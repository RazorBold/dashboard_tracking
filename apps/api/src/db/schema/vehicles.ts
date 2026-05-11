import { pgTable, uuid, varchar, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Vehicle Status Enum ─────────────────────────────
export const vehicleStatusEnum = pgEnum('vehicle_status', ['active', 'inactive', 'maintenance', 'retired']);

// ─── Vehicle Type Enum ───────────────────────────────
export const vehicleTypeEnum = pgEnum('vehicle_type', ['car', 'motorcycle', 'truck', 'bus', 'van', 'other']);

// ─── Insurance Status Enum ───────────────────────────
export const insuranceStatusEnum = pgEnum('insurance_status', ['active', 'expired', 'expiring_soon', 'none']);

// ─── Vehicles Table ──────────────────────────────────
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  plateNo: varchar('plate_no', { length: 20 }).notNull(),
  type: vehicleTypeEnum('type').default('car'),
  make: varchar('make', { length: 50 }),
  model: varchar('model', { length: 50 }),
  maxSpeed: integer('max_speed'),
  vin: varchar('vin', { length: 17 }),
  sn: varchar('sn', { length: 30 }),
  deviceId: uuid('device_id'),
  organizationId: uuid('organization_id'),
  status: vehicleStatusEnum('status').default('active'),
  insuranceStatus: insuranceStatusEnum('insurance_status').default('none'),
  insuranceExpiry: timestamp('insurance_expiry', { withTimezone: true }),
  accumulatedMileage: integer('accumulated_mileage').default(0),
  ownerName: varchar('owner_name', { length: 100 }),
  ownerPhone: varchar('owner_phone', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_vehicles_plate').on(table.plateNo),
  index('idx_vehicles_device').on(table.deviceId),
  index('idx_vehicles_org').on(table.organizationId),
]);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

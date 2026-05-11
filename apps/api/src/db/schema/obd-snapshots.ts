import { pgTable, uuid, varchar, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';

export const obdSnapshots = pgTable('obd_snapshots', {
  id:             uuid('id').primaryKey().defaultRandom(),
  deviceId:       uuid('device_id').notNull(),
  imei:           varchar('imei', { length: 17 }).notNull(),
  timestamp:      timestamp('timestamp', { withTimezone: true }).notNull(),

  // ── Engine ───────────────────────────────────────────
  rpm:            integer('rpm'),
  engineLoad:     numeric('engine_load',    { precision: 5, scale: 2 }),  // %
  coolantTemp:    integer('coolant_temp'),                                  // °C
  intakeTemp:     integer('intake_temp'),                                   // °C
  throttle:       numeric('throttle',       { precision: 5, scale: 2 }),  // %
  timingAdvance:  numeric('timing_advance', { precision: 5, scale: 2 }),  // °BTDC
  mafRate:        numeric('maf_rate',       { precision: 7, scale: 2 }),  // g/s

  // ── Fuel ─────────────────────────────────────────────
  fuelLevel:      numeric('fuel_level',      { precision: 5, scale: 2 }), // %
  fuelPressure:   integer('fuel_pressure'),                                 // kPa
  shortFuelTrim:  numeric('short_fuel_trim', { precision: 5, scale: 2 }), // %
  longFuelTrim:   numeric('long_fuel_trim',  { precision: 5, scale: 2 }), // %

  // ── Speed / Distance ─────────────────────────────────
  vehicleSpeed:   integer('vehicle_speed'),   // km/h
  odometer:       integer('odometer'),         // km

  // ── Electrical ───────────────────────────────────────
  batteryVoltage: numeric('battery_voltage', { precision: 5, scale: 2 }), // V

  // ── Emissions ────────────────────────────────────────
  o2Voltage:      numeric('o2_voltage',      { precision: 5, scale: 2 }), // V

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_obd_snapshots_device_time').on(t.deviceId, t.timestamp),
  index('idx_obd_snapshots_imei').on(t.imei),
]);

export type ObdSnapshot    = typeof obdSnapshots.$inferSelect;
export type NewObdSnapshot = typeof obdSnapshots.$inferInsert;

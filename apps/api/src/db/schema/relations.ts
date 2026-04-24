import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { devices } from './devices';
import { deviceGroups } from './device-groups';
import { vehicles } from './vehicles';
import { drivers } from './drivers';
import { refreshTokens } from './refresh-tokens';
import { devicePositions } from './device-positions';
import { alerts } from './alerts';
import { geofences } from './geofences';

// ─── User Relations ──────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  refreshTokens: many(refreshTokens),
}));

// ─── Organization Relations ──────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  devices: many(devices),
  vehicles: many(vehicles),
  drivers: many(drivers),
  deviceGroups: many(deviceGroups),
  geofences: many(geofences),
}));

// ─── Refresh Token Relations ─────────────────────────
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// ─── Device Relations ────────────────────────────────
export const devicesRelations = relations(devices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [devices.organizationId],
    references: [organizations.id],
  }),
  group: one(deviceGroups, {
    fields: [devices.groupId],
    references: [deviceGroups.id],
  }),
  vehicle: one(vehicles),
  positions: many(devicePositions),
  alerts: many(alerts),
}));

// ─── Device Group Relations ──────────────────────────
export const deviceGroupsRelations = relations(deviceGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [deviceGroups.organizationId],
    references: [organizations.id],
  }),
  devices: many(devices),
}));

// ─── Vehicle Relations ───────────────────────────────
export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  device: one(devices, {
    fields: [vehicles.deviceId],
    references: [devices.id],
  }),
  organization: one(organizations, {
    fields: [vehicles.organizationId],
    references: [organizations.id],
  }),
}));

// ─── Driver Relations ────────────────────────────────
export const driversRelations = relations(drivers, ({ one }) => ({
  organization: one(organizations, {
    fields: [drivers.organizationId],
    references: [organizations.id],
  }),
}));

// ─── Device Position Relations ───────────────────────
export const devicePositionsRelations = relations(devicePositions, ({ one }) => ({
  device: one(devices, {
    fields: [devicePositions.deviceId],
    references: [devices.id],
  }),
}));

// ─── Alert Relations ─────────────────────────────────
export const alertsRelations = relations(alerts, ({ one }) => ({
  device: one(devices, {
    fields: [alerts.deviceId],
    references: [devices.id],
  }),
  processedByUser: one(users, {
    fields: [alerts.processedBy],
    references: [users.id],
  }),
}));

// ─── Geofence Relations ─────────────────────────────
export const geofencesRelations = relations(geofences, ({ one }) => ({
  organization: one(organizations, {
    fields: [geofences.organizationId],
    references: [organizations.id],
  }),
}));

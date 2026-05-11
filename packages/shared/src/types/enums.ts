// ─── User Roles ──────────────────────────────────────
export const USER_ROLES = ['super_admin', 'admin', 'operator', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ─── Organization Plans ──────────────────────────────
export const ORG_PLANS = ['free', 'basic', 'pro', 'enterprise'] as const;
export type OrgPlan = (typeof ORG_PLANS)[number];

// ─── Device Status ───────────────────────────────────
export const DEVICE_STATUSES = ['online', 'offline', 'inactive', 'expired'] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

// ─── Vehicle Status ──────────────────────────────────
export const VEHICLE_STATUSES = ['active', 'inactive', 'maintenance', 'retired'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

// ─── Vehicle Types ───────────────────────────────────
export const VEHICLE_TYPES = ['car', 'motorcycle', 'truck', 'bus', 'van', 'other'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

// ─── Driver Status ───────────────────────────────────
export const DRIVER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

// ─── Insurance Status ────────────────────────────────
export const INSURANCE_STATUSES = ['active', 'expired', 'expiring_soon', 'none'] as const;
export type InsuranceStatus = (typeof INSURANCE_STATUSES)[number];

// ─── Alert Types ─────────────────────────────────────
export const ALERT_TYPES = [
  'acc_on',
  'acc_off',
  'vibration',
  'overspeed',
  'enter_geofence',
  'exit_geofence',
  'collision',
  'sharp_turn_left',
  'sharp_turn_right',
  'sudden_acceleration',
  'sudden_deceleration',
  'low_battery',
  'sos',
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

// ─── Alert Severity ──────────────────────────────────
export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

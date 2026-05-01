export type DeviceStatus = 'online' | 'offline' | 'inactive' | 'expired';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type UserRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

export interface TenantDevice {
  id: string;
  name: string;
  imei: string;
  model: string | null;
  status: DeviceStatus;
  organizationId: string | null;
  lastOnline: string | null;
  createdAt: string;
}

export interface TenantVehicle {
  id: string;
  plateNo: string;
  type: string | null;
  make: string | null;
  model: string | null;
  status: VehicleStatus | null;
  organizationId: string | null;
  ownerName: string | null;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface OrgStats {
  devices: number;
  vehicles: number;
  users: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

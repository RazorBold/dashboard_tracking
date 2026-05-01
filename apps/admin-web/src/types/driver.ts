export type DriverStatus = 'active' | 'inactive' | 'suspended';

export interface Driver {
  id: string;
  driverNo: string;
  name: string;
  phone?: string | null;
  licenseNo?: string | null;
  rfidCardNo?: string | null;
  kc208?: string | null;
  registerPlace?: string | null;
  registerDate?: string | null;
  licenseExpiry?: string | null;
  licenseStatus?: string | null;
  status: DriverStatus;
  organizationId?: string | null;
  fleetName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverListResponse {
  data: Driver[];
  meta: { page: number; limit: number; total: number };
}

export interface DriverFormValues {
  driverNo: string;
  name: string;
  phone?: string;
  licenseNo?: string;
  rfidCardNo?: string;
  kc208?: string;
  registerPlace?: string;
  registerDate?: string;
  licenseExpiry?: string;
  fleetName?: string;
  status?: DriverStatus;
}

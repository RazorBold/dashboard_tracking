export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'bus' | 'van' | 'other';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type InsuranceStatus = 'active' | 'expired' | 'expiring_soon' | 'none';

export interface Vehicle {
  id: string;
  plateNo: string;
  type?: VehicleType | null;
  make?: string | null;
  model?: string | null;
  maxSpeed?: number | null;
  vin?: string | null;
  sn?: string | null;
  deviceId?: string | null;
  organizationId?: string | null;
  status?: VehicleStatus | null;
  insuranceStatus?: InsuranceStatus | null;
  insuranceExpiry?: string | null;
  accumulatedMileage?: number | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  data: Vehicle[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface VehicleFormValues {
  plateNo: string;
  type?: VehicleType;
  make?: string;
  model?: string;
  maxSpeed?: number;
  vin?: string;
  sn?: string;
  ownerName?: string;
  ownerPhone?: string;
  status?: VehicleStatus;
}

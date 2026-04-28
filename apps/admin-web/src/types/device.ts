export type DeviceStatus = 'online' | 'offline' | 'inactive' | 'expired';

export interface Device {
  id: string;
  name: string;
  imei: string;
  model?: string | null;
  status: DeviceStatus;
  groupId?: string | null;
  lat?: number | null;
  lng?: number | null;
  speed?: number | null;
  // --- New Dummy Telemetry Data ---
  accStatus?: boolean;
  parkedDuration?: string;
  batteryVoltage?: string;
  batteryLevel?: number;
  gnssType?: string;
  satellites?: number;
  gsmSignal?: string;
  lastOnline?: string;
  lastFix?: string;
  todayMileage?: number;
  // --- New Dummy Vehicle Info ---
  vehicle?: {
    ownerName: string;
    phone: string;
    plateNo: string;
    make: string;
    model: string;
    vin: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeviceListResponse {
  data: Device[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

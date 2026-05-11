export type DeviceStatus = 'online' | 'offline' | 'inactive' | 'expired';

export interface Device {
  id: string;
  name: string;
  imei: string;
  model?: string | null;
  status: DeviceStatus;
  groupId?: string | null;
  // Real position data from API
  lat?: number | null;
  lng?: number | null;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  satellites?: number | null;
  gsmSignal?: number | null;
  positionTimestamp?: string | null; // timestamp of latest GPS fix
  lastOnline?: string | null;        // last time device sent data
  // Enriched telemetry (partially from API, partially computed)
  accStatus?: boolean;
  parkedDuration?: string;
  batteryVoltage?: string;
  batteryLevel?: number;
  gnssType?: string;
  gsmSignalLabel?: string;
  lastFix?: string;
  todayMileage?: number;
  // Linked vehicle info
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

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

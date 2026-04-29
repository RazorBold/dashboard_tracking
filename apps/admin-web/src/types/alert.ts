export type AlertType =
  | 'acc_on' | 'acc_off' | 'vibration' | 'overspeed'
  | 'enter_geofence' | 'exit_geofence'
  | 'collision' | 'sharp_turn_left' | 'sharp_turn_right'
  | 'sudden_acceleration' | 'sudden_deceleration'
  | 'low_battery' | 'sos';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  deviceId: string;
  organizationId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  speed: number | null;
  isRead: boolean;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  device?: {
    name: string;
    imei: string;
  };
}

export interface AlertListResponse {
  data: Alert[];
}

export interface AlertFilters {
  limit?: number;
  offset?: number;
  type?: AlertType[];
  isRead?: boolean;
  from?: string;
  to?: string;
}

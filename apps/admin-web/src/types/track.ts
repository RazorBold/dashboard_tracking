export interface TrackPosition {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  satellites: number | null;
  gsmSignal: number | null;
  batteryVoltage: number | null;
  accStatus: number | null;
  mileage: number | null;
  timestamp: string;
}

export interface TrackHistoryResponse {
  success: boolean;
  data: TrackPosition[];
}

export interface TripSummary {
  totalPoints: number;
  totalDistanceKm: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  durationMinutes: number;
  stoppedMinutes: number;
}

export type GeofenceType = 'circle' | 'polygon';

export interface CircleGeometry {
  center: { lat: number; lng: number };
  radius: number; // meters
}

export interface PolygonGeometry {
  points: { lat: number; lng: number }[];
}

export type GeofenceGeometry = CircleGeometry | PolygonGeometry;

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  geometry: GeofenceGeometry;
  organizationId: string | null;
  description: string | null;
  assignedDeviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceFormValues {
  name: string;
  type: GeofenceType;
  geometry: GeofenceGeometry;
  description?: string | null;
  assignedDeviceIds?: string[];
}

import type { Geofence, CircleGeometry, PolygonGeometry } from '../types/geofence';
import type { Device } from '../types/device';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lat: number, lng: number, points: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i];
    const pj = points[j];
    if (
      pi.lng > lng !== pj.lng > lng &&
      lat < ((pj.lat - pi.lat) * (lng - pi.lng)) / (pj.lng - pi.lng) + pi.lat
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function isDeviceInFence(lat: number, lng: number, fence: Geofence): boolean {
  if (fence.type === 'circle') {
    const geo = fence.geometry as CircleGeometry;
    return haversineDistance(lat, lng, geo.center.lat, geo.center.lng) <= geo.radius;
  }
  const geo = fence.geometry as PolygonGeometry;
  return pointInPolygon(lat, lng, geo.points);
}

export function groupDevicesByZone(
  devices: Device[],
  fences: Geofence[],
): Map<string, Device[]> {
  const map = new Map<string, Device[]>(fences.map((f) => [f.id, []]));
  for (const device of devices) {
    if (device.lat == null || device.lng == null) continue;
    for (const fence of fences) {
      if (isDeviceInFence(device.lat, device.lng, fence)) {
        map.get(fence.id)!.push(device);
      }
    }
  }
  return map;
}

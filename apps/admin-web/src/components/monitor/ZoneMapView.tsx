import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Geofence, CircleGeometry, PolygonGeometry } from '../../types/geofence';
import type { Device } from '../../types/device';

const ZONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

const ICON_CACHE: Record<string, L.DivIcon> = {};

function getMarkerIcon(status: string, isSelected: boolean, isHighlighted: boolean): L.DivIcon {
  const key = `${status}-${isSelected}-${isHighlighted}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const colors: Record<string, string> = {
    online: '#10b981',
    offline: '#64748b',
    inactive: '#f59e0b',
    expired: '#ef4444',
  };
  const color = colors[status] ?? colors.offline;
  const size = isSelected ? 36 : isHighlighted ? 30 : 22;
  const border = isSelected || isHighlighted ? 4 : 2;
  const shadow = isSelected
    ? `0 0 14px ${color}, 0 3px 6px rgba(0,0,0,0.4)`
    : isHighlighted
    ? `0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.3)`
    : '0 2px 4px rgba(0,0,0,0.3)';

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border}px solid white;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
    "><div style="width:${Math.round(size*0.35)}px;height:${Math.round(size*0.35)}px;border-radius:50%;background:rgba(255,255,255,0.7)"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  ICON_CACHE[key] = icon;
  return icon;
}

// ─── Fit all zones on first load ──────────────────────
function FitAllZones({ fences }: { fences: Geofence[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fences.length === 0 || fitted.current) return;
    fitted.current = true;
    const pts: [number, number][] = [];
    for (const f of fences) {
      const geo = f.geometry as any;
      if (f.type === 'circle') pts.push([geo.center.lat, geo.center.lng]);
      else for (const p of geo.points) pts.push([p.lat, p.lng]);
    }
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
  }, [fences, map]);
  return null;
}

// ─── Fly to selected zone ─────────────────────────────
function FlyToZone({ fences, selectedId }: { fences: Geofence[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const fence = fences.find((f) => f.id === selectedId);
    if (!fence) return;
    if (fence.type === 'circle') {
      const geo = fence.geometry as CircleGeometry;
      map.setView([geo.center.lat, geo.center.lng], 14, { animate: true, duration: 0.5 });
    } else {
      const geo = fence.geometry as PolygonGeometry;
      const pts = geo.points.map((p) => [p.lat, p.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [selectedId, fences, map]);
  return null;
}

// ─── Click outside to deselect device ────────────────
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// ─── Main component ───────────────────────────────────
interface Props {
  fences: Geofence[];
  devices: Device[];
  devicesByZone: Map<string, Device[]>;
  selectedFenceId: string | null;
  selectedDeviceId?: string;
  onSelectDevice: (device: Device) => void;
  onDeselectDevice?: () => void;
}

const MAP_CENTER: [number, number] = [-2.5, 118.0];

export function ZoneMapView({
  fences,
  devices,
  devicesByZone,
  selectedFenceId,
  selectedDeviceId,
  onSelectDevice,
  onDeselectDevice,
}: Props) {
  // Devices inside the selected zone (for highlight)
  const devicesInSelected = selectedFenceId
    ? new Set((devicesByZone.get(selectedFenceId) ?? []).map((d) => d.id))
    : null;

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={5}
      className="w-full h-full"
      preferCanvas={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zone polygons / circles */}
      {fences.map((fence, idx) => {
        const color = ZONE_COLORS[idx % ZONE_COLORS.length];
        const devs = devicesByZone.get(fence.id) ?? [];
        const isSelected = fence.id === selectedFenceId;
        const hasDevices = devs.length > 0;

        const opts = {
          color: hasDevices ? color : '#94a3b8',
          fillColor: hasDevices ? color : '#94a3b8',
          fillOpacity: isSelected ? 0.28 : hasDevices ? 0.14 : 0.06,
          weight: isSelected ? 3 : hasDevices ? 2 : 1,
          dashArray: hasDevices ? undefined : '5 4',
        };

        if (fence.type === 'circle') {
          const geo = fence.geometry as CircleGeometry;
          return (
            <Circle
              key={fence.id}
              center={[geo.center.lat, geo.center.lng]}
              radius={geo.radius}
              pathOptions={opts}
            >
              <Tooltip sticky>{fence.name} · {devs.length} vehicle{devs.length !== 1 ? 's' : ''}</Tooltip>
            </Circle>
          );
        }
        const geo = fence.geometry as PolygonGeometry;
        return (
          <Polygon
            key={fence.id}
            positions={geo.points.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={opts}
          >
            <Tooltip sticky>{fence.name} · {devs.length} vehicle{devs.length !== 1 ? 's' : ''}</Tooltip>
          </Polygon>
        );
      })}

      {/* Device markers */}
      {devices.map((device) => {
        if (device.lat == null || device.lng == null) return null;
        const isSelected = device.id === selectedDeviceId;
        const isHighlighted = devicesInSelected != null && devicesInSelected.has(device.id);

        return (
          <Marker
            key={device.id}
            position={[device.lat, device.lng]}
            icon={getMarkerIcon(device.status, isSelected, isHighlighted)}
            eventHandlers={{ click: () => onSelectDevice(device) }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              <span className="font-medium">{device.name}</span>
              {device.speed != null && <span> · {Math.round(device.speed)} km/h</span>}
            </Tooltip>
          </Marker>
        );
      })}

      <FitAllZones fences={fences} />
      <FlyToZone fences={fences} selectedId={selectedFenceId} />
      <MapClickHandler onMapClick={() => onDeselectDevice?.()} />
    </MapContainer>
  );
}

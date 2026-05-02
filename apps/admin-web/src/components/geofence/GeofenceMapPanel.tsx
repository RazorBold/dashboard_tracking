import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Geofence, CircleGeometry, PolygonGeometry } from '../../types/geofence';

// Colour palette per geofence index
const FENCE_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4'];

const CENTER_ICON = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
  iconAnchor: [5, 5],
});

const POINT_ICON = L.divIcon({
  className: '',
  html: '<div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,.4)"></div>',
  iconAnchor: [4, 4],
});

// ─── FitBounds on first load only ────────────────────
function FitFences({ fences }: { fences: Geofence[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fences.length === 0 || fitted.current) return;
    fitted.current = true;
    const allPoints: [number, number][] = [];
    for (const f of fences) {
      const geo = f.geometry as any;
      if (f.type === 'circle') {
        allPoints.push([geo.center.lat, geo.center.lng]);
      } else {
        for (const p of geo.points) allPoints.push([p.lat, p.lng]);
      }
    }
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 14 });
    }
  }, [fences, map]);
  return null;
}

// ─── Pan/zoom to selected geofence ───────────────────
function FlyToFence({ fences, selectedId }: { fences: Geofence[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const fence = fences.find((f) => f.id === selectedId);
    if (!fence) return;
    if (fence.type === 'circle') {
      const geo = fence.geometry as CircleGeometry;
      map.setView([geo.center.lat, geo.center.lng], 15, { animate: true, duration: 0.5 });
    } else {
      const geo = fence.geometry as PolygonGeometry;
      const pts = geo.points.map((p) => [p.lat, p.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [selectedId, fences, map]);
  return null;
}

// ─── Drawing handler ─────────────────────────────────
interface DrawingProps {
  mode: 'none' | 'circle' | 'polygon';
  draftCenter: [number, number] | null;
  draftRadius: number;
  draftPoints: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
}

function DrawingLayer({ mode, draftCenter, draftRadius, draftPoints, onMapClick }: DrawingProps) {
  useMapEvents({
    click(e) {
      if (mode !== 'none') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  if (mode === 'circle' && draftCenter) {
    return (
      <>
        <Circle
          center={draftCenter}
          radius={draftRadius}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
        />
        <Marker position={draftCenter} icon={CENTER_ICON} />
      </>
    );
  }

  if (mode === 'polygon' && draftPoints.length > 0) {
    return (
      <>
        {draftPoints.length >= 3 && (
          <Polygon
            positions={draftPoints}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
          />
        )}
        {draftPoints.map((p, i) => (
          <Marker key={i} position={p} icon={POINT_ICON} />
        ))}
      </>
    );
  }

  return null;
}

// ─── Main map panel ───────────────────────────────────
interface Props {
  fences: Geofence[];
  selectedId: string | null;
  drawMode: 'none' | 'circle' | 'polygon';
  draftCenter: [number, number] | null;
  draftRadius: number;
  draftPoints: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
}

const MAP_CENTER: [number, number] = [-2.5, 118.0];
export function GeofenceMapPanel({ fences, selectedId, drawMode, draftCenter, draftRadius, draftPoints, onMapClick }: Props) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={5}
      className="w-full h-full rounded-xl"
      ref={mapRef}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Existing geofences */}
      {fences.map((fence, idx) => {
        const color = FENCE_COLORS[idx % FENCE_COLORS.length];
        const isSelected = fence.id === selectedId;
        const opts = {
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.25 : 0.12,
          weight: isSelected ? 3 : 1.5,
        };

        if (fence.type === 'circle') {
          const geo = fence.geometry as CircleGeometry;
          return (
            <Circle key={fence.id} center={[geo.center.lat, geo.center.lng]} radius={geo.radius} pathOptions={opts} />
          );
        }
        const geo = fence.geometry as PolygonGeometry;
        return (
          <Polygon key={fence.id} positions={geo.points.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={opts} />
        );
      })}

      {/* Drawing layer */}
      <DrawingLayer
        mode={drawMode}
        draftCenter={draftCenter}
        draftRadius={draftRadius}
        draftPoints={draftPoints}
        onMapClick={onMapClick}
      />

      {fences.length > 0 && drawMode === 'none' && <FitFences fences={fences} />}
      {fences.length > 0 && drawMode === 'none' && <FlyToFence fences={fences} selectedId={selectedId} />}
    </MapContainer>
  );
}

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import type { TrackPosition } from '../../types/track';

export const TRACK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

interface TrackLayer {
  deviceId: string;
  positions: TrackPosition[];
  color: string;
  visible: boolean;
}

interface Props {
  tracks: TrackLayer[];
}

function FitAllBounds({ tracks }: { tracks: TrackLayer[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    const allPositions = tracks
      .filter((t) => t.visible && t.positions.length > 0)
      .flatMap((t) => t.positions.map((p) => [p.latitude, p.longitude] as [number, number]));

    if (allPositions.length === 0) return;
    fitted.current = false;
  }, [tracks.map((t) => t.deviceId + t.positions.length).join(',')]);

  useEffect(() => {
    if (fitted.current) return;
    const allPositions = tracks
      .filter((t) => t.visible && t.positions.length > 0)
      .flatMap((t) => t.positions.map((p) => [p.latitude, p.longitude] as [number, number]));

    if (allPositions.length === 0) return;
    fitted.current = true;
    map.fitBounds(allPositions, { padding: [40, 40], maxZoom: 15 });
  });

  return null;
}

export function MultiTrackMapView({ tracks }: Props) {
  const hasAny = tracks.some((t) => t.visible && t.positions.length > 0);

  return (
    <MapContainer
      center={[-6.2088, 106.8456]}
      zoom={12}
      className="w-full h-full"
      preferCanvas
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {hasAny && <FitAllBounds tracks={tracks} />}

      {tracks.map((track) => {
        if (!track.visible || track.positions.length < 2) return null;
        const latlngs = track.positions.map((p) => [p.latitude, p.longitude] as [number, number]);
        const first = track.positions[0];
        const last = track.positions[track.positions.length - 1];

        return (
          <div key={track.deviceId}>
            <Polyline
              positions={latlngs}
              pathOptions={{ color: track.color, weight: 3, opacity: 0.85 }}
            />
            {/* Start marker */}
            <CircleMarker
              center={[first.latitude, first.longitude]}
              radius={6}
              pathOptions={{ color: '#fff', fillColor: track.color, fillOpacity: 1, weight: 2 }}
            />
            {/* End marker */}
            <CircleMarker
              center={[last.latitude, last.longitude]}
              radius={6}
              pathOptions={{ color: '#fff', fillColor: track.color, fillOpacity: 1, weight: 2, dashArray: '3' }}
            />
          </div>
        );
      })}

      {/* Single-point markers (no polyline) */}
      {tracks.map((track) => {
        if (!track.visible || track.positions.length !== 1) return null;
        const p = track.positions[0];
        return (
          <CircleMarker
            key={track.deviceId}
            center={[p.latitude, p.longitude]}
            radius={6}
            pathOptions={{ color: '#fff', fillColor: track.color, fillOpacity: 1, weight: 2 }}
          />
        );
      })}
    </MapContainer>
  );
}

import { useEffect, useRef, Fragment } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
      preferCanvas={false}
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
          <Fragment key={track.deviceId}>
            {/* Route line */}
            <Polyline
              positions={latlngs}
              pathOptions={{ color: track.color, weight: 3, opacity: 0.85 }}
            />

            {/* GPS point dots with tooltip */}
            {track.positions.map((pos, i) => {
              const spd = pos.speed ?? 0;
              const isStopped = spd < 3;
              return (
                <CircleMarker
                  key={`${track.deviceId}-dot-${i}`}
                  center={[pos.latitude, pos.longitude]}
                  radius={isStopped ? 5 : 3}
                  pathOptions={{
                    color: isStopped ? '#ef4444' : track.color,
                    fillColor: isStopped ? '#fca5a5' : track.color,
                    fillOpacity: isStopped ? 0.9 : 0.65,
                    weight: isStopped ? 2 : 1.5,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      <strong style={{ color: track.color }}>
                        {track.deviceId.slice(0, 8)}…
                      </strong>
                      {' '}· Point #{i + 1}<br />
                      🕐 {formatTime(pos.timestamp)}<br />
                      🚗 {spd.toFixed(0)} km/h<br />
                      📍 {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                      {isStopped && (
                        <><br /><span style={{ color: '#ef4444', fontWeight: 600 }}>⏸ Stopped</span></>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {/* Start marker (larger, filled) */}
            <CircleMarker
              center={[first.latitude, first.longitude]}
              radius={8}
              pathOptions={{
                color: '#fff',
                fillColor: track.color,
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Tooltip direction="top" permanent={false} opacity={0.95}>
                <span style={{ fontSize: '11px' }}>
                  ▶ Start · {formatTime(first.timestamp)}
                </span>
              </Tooltip>
            </CircleMarker>

            {/* End marker (dashed border) */}
            <CircleMarker
              center={[last.latitude, last.longitude]}
              radius={8}
              pathOptions={{
                color: '#fff',
                fillColor: track.color,
                fillOpacity: 1,
                weight: 2.5,
                dashArray: '4',
              }}
            >
              <Tooltip direction="top" permanent={false} opacity={0.95}>
                <span style={{ fontSize: '11px' }}>
                  ⏹ End · {formatTime(last.timestamp)}
                </span>
              </Tooltip>
            </CircleMarker>
          </Fragment>
        );
      })}

      {/* Single-point markers */}
      {tracks.map((track) => {
        if (!track.visible || track.positions.length !== 1) return null;
        const p = track.positions[0];
        return (
          <CircleMarker
            key={track.deviceId}
            center={[p.latitude, p.longitude]}
            radius={6}
            pathOptions={{ color: '#fff', fillColor: track.color, fillOpacity: 1, weight: 2 }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <span style={{ fontSize: '11px' }}>
                {track.deviceId.slice(0, 8)}… · {formatTime(p.timestamp)}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

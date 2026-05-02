import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TrackPosition } from '../../types/track';

// Speed → color gradient: green (0) → yellow (60) → red (120+)
function speedColor(speed: number): string {
  const kmh = speed ?? 0;
  if (kmh < 20)  return '#10b981'; // emerald
  if (kmh < 40)  return '#84cc16'; // lime
  if (kmh < 60)  return '#eab308'; // yellow
  if (kmh < 80)  return '#f97316'; // orange
  return '#ef4444';                 // red
}

// Break positions into colored segments
function buildSegments(positions: TrackPosition[]): Array<{ pts: [number, number][]; color: string }> {
  if (positions.length < 2) return [];
  const segs: Array<{ pts: [number, number][]; color: string }> = [];
  let currentColor = speedColor(positions[0].speed ?? 0);
  let currentPts: [number, number][] = [[positions[0].latitude, positions[0].longitude]];

  for (let i = 1; i < positions.length; i++) {
    const color = speedColor(positions[i].speed ?? 0);
    currentPts.push([positions[i].latitude, positions[i].longitude]);
    if (color !== currentColor || i === positions.length - 1) {
      segs.push({ pts: [...currentPts], color: currentColor });
      currentColor = color;
      currentPts = [[positions[i].latitude, positions[i].longitude]];
    }
  }
  return segs;
}

function makePlaybackIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'track-playback-marker',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 0 8px ${color},0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function FitBounds({ positions }: { positions: TrackPosition[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (positions.length < 2) return;
    const lats = positions.map((p) => p.latitude);
    const lngs = positions.map((p) => p.longitude);
    const bounds: L.LatLngBoundsLiteral = [
      [Math.min(...lats) - 0.005, Math.min(...lngs) - 0.005],
      [Math.max(...lats) + 0.005, Math.max(...lngs) + 0.005],
    ];
    map.fitBounds(bounds, { animate: true, duration: 0.8 });
    fitted.current = true;
  }, [positions, map]);

  return null;
}

interface Props {
  positions: TrackPosition[];
  playbackIndex: number | null;
}

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

export function TrackMapView({ positions, playbackIndex }: Props) {
  const segments = buildSegments(positions);
  const playbackPos = playbackIndex != null ? positions[playbackIndex] : null;
  const startPos = positions[0];
  const endPos = positions[positions.length - 1];

  const startIcon = L.divIcon({
    className: 'track-start-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 0 6px #10b981,0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
  const endIcon = L.divIcon({
    className: 'track-end-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 6px #ef4444,0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      className="map-view"
      style={{ height: '100%', width: '100%' }}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {positions.length >= 2 && <FitBounds positions={positions} />}

      {/* Speed-colored polyline segments */}
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.pts} color={seg.color} weight={4} opacity={0.85} />
      ))}

      {/* Individual GPS point dots — visible as small circles along the route */}
      {positions.map((pos, i) => {
        const spd = pos.speed ?? 0;
        const isStopped = spd < 3;
        return (
          <CircleMarker
            key={`dot-${i}`}
            center={[pos.latitude, pos.longitude]}
            radius={isStopped ? 5 : 3}
            pathOptions={{
              color: isStopped ? '#ef4444' : speedColor(spd),
              fillColor: isStopped ? '#fecaca' : speedColor(spd),
              fillOpacity: isStopped ? 0.9 : 0.7,
              weight: isStopped ? 2 : 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Point #{i + 1}</strong><br />
                🕐 {formatTime(pos.timestamp)}<br />
                🚗 {spd.toFixed(0)} km/h<br />
                📍 {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                {isStopped && <><br /><span style={{ color: '#ef4444', fontWeight: 600 }}>⏸ Stopped</span></>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Start / End markers */}
      {startPos && (
        <Marker position={[startPos.latitude, startPos.longitude]} icon={startIcon} zIndexOffset={200} />
      )}
      {endPos && endPos !== startPos && (
        <Marker position={[endPos.latitude, endPos.longitude]} icon={endIcon} zIndexOffset={200} />
      )}

      {/* Playback cursor */}
      {playbackPos && (
        <Marker
          position={[playbackPos.latitude, playbackPos.longitude]}
          icon={makePlaybackIcon(speedColor(playbackPos.speed ?? 0))}
          zIndexOffset={1000}
        />
      )}
    </MapContainer>
  );
}

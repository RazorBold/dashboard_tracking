import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Device, DeviceStatus } from '../../types/device';

// ─── Selection controller: fly-to + auto open popup ──────────────────────────
function SelectionController({
  selectedId,
  device,
  markerRefs,
}: {
  selectedId: string | undefined;
  device: Device | undefined;
  markerRefs: { current: Record<string, L.Marker> };
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;

    if (device?.lat != null && device?.lng != null) {
      const targetZoom = Math.max(map.getZoom(), 15);
      map.setView([device.lat, device.lng], targetZoom, { animate: true, duration: 0.5 });
    }

    // Open the popup after the pan animation starts
    const marker = markerRefs.current[selectedId];
    if (marker) {
      setTimeout(() => marker.openPopup(), 350);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

// ─── Marker icon ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<DeviceStatus, string> = {
  online:   '#10b981',
  offline:  '#64748b',
  inactive: '#f59e0b',
  expired:  '#ef4444',
};

const ICON_CACHE: Record<string, L.DivIcon> = {};

function getMarkerIcon(status: DeviceStatus, isSelected: boolean): L.DivIcon {
  const key = `${status}-${isSelected}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const color  = STATUS_COLORS[status] ?? STATUS_COLORS.offline;
  const size   = isSelected ? 36 : 24;
  const border = isSelected ? 4 : 3;
  const shadow = isSelected
    ? `0 0 16px ${color}, 0 4px 8px rgba(0,0,0,0.5)`
    : '0 3px 6px rgba(0,0,0,0.4)';
  const dotSize = isSelected ? 12 : 8;

  const icon = L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
        background:${color};width:${size}px;height:${size}px;border-radius:50%;
        border:${border}px solid white;box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;">
        <div style="background:white;width:${dotSize}px;height:${dotSize}px;border-radius:50%;opacity:.85;"></div>
      </div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });

  ICON_CACHE[key] = icon;
  return icon;
}

// ─── Popup helpers ────────────────────────────────────────────────────────────
function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function descriptiveStatus(device: Device): string {
  if (device.status === 'online') {
    const spd = device.speed ?? 0;
    return spd > 0 ? `Moving · ${spd} km/h` : 'Parked (Idle)';
  }
  return device.status.charAt(0).toUpperCase() + device.status.slice(1);
}

const STATUS_BG: Record<DeviceStatus, string> = {
  online:   '#f0fdf4',
  offline:  '#f8fafc',
  inactive: '#fffbeb',
  expired:  '#fef2f2',
};

const STATUS_TEXT: Record<DeviceStatus, string> = {
  online:   '#059669',
  offline:  '#475569',
  inactive: '#d97706',
  expired:  '#dc2626',
};

// ─── Popup component ──────────────────────────────────────────────────────────
function DevicePopup({ device, onSelect }: { device: Device; onSelect?: (d: Device) => void }) {
  const color   = STATUS_COLORS[device.status] ?? STATUS_COLORS.offline;
  const hasLoc  = device.lat != null && device.lng != null;

  return (
    <div
      style={{
        minWidth: 230, maxWidth: 270,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,.15)',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* ── Header ─────────────────────────────── */}
      <div style={{
        background: '#0f172a',
        borderLeft: `4px solid ${color}`,
        padding: '10px 12px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2, lineHeight: 1.3 }}>
          {device.name}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6 }}>
          {device.model && <span>{device.model}</span>}
          <span style={{ color: '#475569' }}>·</span>
          <span style={{ fontFamily: 'monospace' }}>{device.imei}</span>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────── */}
      <div style={{
        background: STATUS_BG[device.status],
        borderBottom: `1px solid ${color}22`,
        padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: device.status === 'online' ? `0 0 6px ${color}` : 'none',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_TEXT[device.status] }}>
          {descriptiveStatus(device)}
        </span>
      </div>

      {/* ── Body ───────────────────────────────── */}
      <div style={{ background: '#fff', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>

        {/* Last Update */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🕐</span>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Update</div>
            <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>
              {device.lastOnline
                ? `${timeAgo(device.lastOnline)} · ${new Date(device.lastOnline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : '—'}
            </div>
          </div>
        </div>

        {/* Coordinates */}
        {hasLoc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>📍</span>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coordinates</div>
              <div style={{ fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                {(device.lat as number).toFixed(6)}, {(device.lng as number).toFixed(6)}
              </div>
            </div>
          </div>
        )}

        {/* Speed + Heading */}
        {device.status === 'online' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            <div style={{
              flex: 1, background: '#f8fafc', borderRadius: 6,
              padding: '4px 8px', textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Speed</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {device.speed ?? 0} <span style={{ fontSize: 10, fontWeight: 400 }}>km/h</span>
              </div>
            </div>
            <div style={{
              flex: 1, background: '#f8fafc', borderRadius: 6,
              padding: '4px 8px', textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Satellites</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {device.satellites ?? '—'}
              </div>
            </div>
          </div>
        )}

        {/* Driver / Owner */}
        {device.vehicle?.ownerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>👤</span>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver</div>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{device.vehicle.ownerName}</div>
            </div>
          </div>
        )}

        {/* License Plate */}
        {device.vehicle?.plateNo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🚘</span>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>License Plate</div>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: '0.05em' }}>{device.vehicle.plateNo}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer / Action ─────────────────────── */}
      {onSelect && (
        <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '7px 12px' }}>
          <button
            onClick={() => onSelect(device)}
            style={{
              width: '100%', padding: '5px 0',
              background: color, color: '#fff',
              border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            View Detail →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  devices: Device[];
  selectedId?: string;
  onSelect?: (device: Device) => void;
}

const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;

export function MapView({ devices, selectedId, onSelect }: Props) {
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const located    = devices.filter((d) => d.lat != null && d.lng != null);
  const selected   = located.find((d) => d.id === selectedId);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-view"
      style={{ height: '100%', width: '100%' }}
      preferCanvas={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SelectionController
        selectedId={selectedId}
        device={selected}
        markerRefs={markerRefs}
      />

      {located.map((device) => {
        const isSelected = device.id === selectedId;
        return (
          <Marker
            key={device.id}
            ref={(m) => { if (m) markerRefs.current[device.id] = m; }}
            position={[device.lat as number, device.lng as number]}
            icon={getMarkerIcon(device.status, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup minWidth={230} maxWidth={280} className="device-map-popup">
              <DevicePopup device={device} onSelect={onSelect} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

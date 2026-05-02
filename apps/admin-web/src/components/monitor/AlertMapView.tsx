import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Alert, AlertType, AlertSeverity } from '../../types/alert';

// ─── Icon config per alert type ─────────────────────────────────────────────
const ALERT_ICON_MAP: Record<AlertType, { emoji: string; label: string }> = {
  acc_on:               { emoji: '🟢', label: 'Engine On' },
  acc_off:              { emoji: '⭕', label: 'Engine Off' },
  overspeed:            { emoji: '🚀', label: 'Overspeed' },
  vibration:            { emoji: '📳', label: 'Vibration' },
  collision:            { emoji: '💥', label: 'Collision' },
  sharp_turn_left:      { emoji: '↰',  label: 'Sharp Turn Left' },
  sharp_turn_right:     { emoji: '↱',  label: 'Sharp Turn Right' },
  sudden_acceleration:  { emoji: '⬆️', label: 'Sudden Accel' },
  sudden_deceleration:  { emoji: '⬇️', label: 'Sudden Decel' },
  enter_geofence:       { emoji: '📥', label: 'Enter Geofence' },
  exit_geofence:        { emoji: '📤', label: 'Exit Geofence' },
  low_battery:          { emoji: '🪫', label: 'Low Battery' },
  sos:                  { emoji: '🆘', label: 'SOS' },
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info:     '#3b82f6',
  warning:  '#f59e0b',
  critical: '#ef4444',
};

const SEVERITY_GLOW: Record<AlertSeverity, string> = {
  info:     '0 0 10px rgba(59,130,246,0.6)',
  warning:  '0 0 10px rgba(245,158,11,0.7)',
  critical: '0 0 14px rgba(239,68,68,0.9)',
};

// ─── Icon builder ────────────────────────────────────────────────────────────
const ICON_CACHE: Record<string, L.DivIcon> = {};

function makeAlertIcon(
  type: AlertType,
  severity: AlertSeverity,
  isSelected: boolean,
  isUnread: boolean,
): L.DivIcon {
  const key = `${type}-${severity}-${isSelected}-${isUnread}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const { emoji } = ALERT_ICON_MAP[type] ?? { emoji: '⚠️' };
  const color = SEVERITY_COLOR[severity];
  const glow  = SEVERITY_GLOW[severity];
  const size  = isSelected ? 44 : 32;
  const emojiPx = isSelected ? 20 : 15;

  const pulseRing = severity === 'critical' && isUnread
    ? `<span style="position:absolute;inset:-5px;border-radius:50%;border:2px solid ${color};opacity:0.6;animation:alert-pulse 1.4s ease-out infinite;"></span>`
    : '';

  const html = `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSelected ? 3 : 2.5}px solid white;box-shadow:${isSelected ? glow + ',0 4px 10px rgba(0,0,0,0.45)' : '0 2px 6px rgba(0,0,0,0.35)'};display:flex;align-items:center;justify-content:center;font-size:${emojiPx}px;line-height:1;${isSelected ? 'transform:scale(1.1);' : ''}">
    ${pulseRing}${emoji}
  </div>`;

  const icon = L.divIcon({
    className: '',
    html,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });

  ICON_CACHE[key] = icon;
  return icon;
}

// ─── FlyTo helper ─────────────────────────────────────────────────────────────
function FlyToAlert({ alert }: { alert: Alert | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (alert?.latitude == null || alert?.longitude == null) return;
    const target: [number, number] = [alert.latitude, alert.longitude];
    const currentZoom = map.getZoom();
    const targetZoom = currentZoom >= 15 ? currentZoom : 15;

    map.flyTo(target, targetZoom, {
      animate: true,
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [alert, map]);
  return null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  alerts:     Alert[];
  selectedId?: string;
  onSelect?:  (alert: Alert) => void;
}

const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];

export function AlertMapView({ alerts, selectedId, onSelect }: Props) {
  const located = alerts.filter((a) => a.latitude != null && a.longitude != null);
  const selected = located.find((a) => a.id === selectedId);

  return (
    <>
      <style>{`
        @keyframes alert-pulse {
          0%   { transform:scale(1);   opacity:0.6; }
          70%  { transform:scale(1.7); opacity:0;   }
          100% { transform:scale(1.7); opacity:0;   }
        }
      `}</style>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={5}
        className="map-view"
        style={{ height: '100%', width: '100%' }}
        preferCanvas={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToAlert alert={selected} />

        {located.map((alert) => {
          const isSelected = alert.id === selectedId;
          const meta = ALERT_ICON_MAP[alert.type] ?? { emoji: '⚠️', label: alert.type };

          return (
            <Marker
              key={alert.id}
              position={[alert.latitude as number, alert.longitude as number]}
              icon={makeAlertIcon(alert.type, alert.severity, isSelected, !alert.isRead)}
              zIndexOffset={isSelected ? 1000 : alert.severity === 'critical' ? 500 : 0}
              eventHandlers={{ click: () => onSelect?.(alert) }}
            >
              <Popup>
                <div style={{ minWidth: 185, fontSize: 12, lineHeight: 1.65 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    {meta.emoji} {meta.label}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 8px',
                    borderRadius: 99,
                    background: SEVERITY_COLOR[alert.severity],
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    {alert.severity}
                  </span>
                  {alert.device && (
                    <div>🚗 <strong>{alert.device.name}</strong></div>
                  )}
                  {alert.message && (
                    <div style={{ color: '#475569', marginTop: 2 }}>{alert.message}</div>
                  )}
                  {alert.speed != null && (
                    <div>🚀 {alert.speed} km/h</div>
                  )}
                  <div style={{ color: '#94a3b8', marginTop: 4 }}>
                    🕐 {fmtTime(alert.createdAt)}
                  </div>
                  {!alert.isRead && (
                    <div style={{ color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                      ● Belum dibaca
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}

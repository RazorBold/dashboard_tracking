import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Device } from '../../types/device';

interface FlyToProps {
  device: Device | undefined;
}

function FlyToDevice({ device }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (device?.lat != null && device?.lng != null) {
      // Use setView instead of flyTo. flyTo calculates heavy bounding boxes and zooms out,
      // which causes massive lag when there are many markers. setView smoothly pans.
      map.setView([device.lat, device.lng], 15, { animate: true, duration: 1 });
    }
  }, [device, map]);
  return null;
}

interface Props {
  devices: Device[];
  selectedId?: string;
  onSelect?: (device: Device) => void;
}

const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;

const ICON_CACHE: Record<string, L.DivIcon> = {};

const getMarkerIcon = (status: string, isSelected: boolean) => {
  const key = `${status}-${isSelected}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  // Use slightly deeper, more vibrant colors so they pop against the light map
  const colors: Record<string, string> = {
    online: '#10b981',   // emerald-500
    offline: '#64748b',  // slate-500
    inactive: '#f59e0b', // amber-500
    expired: '#ef4444',  // red-500
  };
  const color = colors[status] || colors.offline;
  
  // Significantly larger sizes for better visibility
  const size = isSelected ? 36 : 24;
  const border = isSelected ? 4 : 3;
  const shadow = isSelected 
    ? `0 0 16px ${color}, 0 4px 8px rgba(0,0,0,0.5)` 
    : '0 3px 6px rgba(0,0,0,0.4)';

  // Inner dot to make it look like a professional navigation marker
  const innerDotSize = isSelected ? 12 : 8;

  const icon = L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: ${border}px solid white; 
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: white;
          width: ${innerDotSize}px;
          height: ${innerDotSize}px;
          border-radius: 50%;
          opacity: 0.85;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2], // Perfect center anchor
    popupAnchor: [0, -(size / 2)],
  });

  ICON_CACHE[key] = icon;
  return icon;
};

export function MapView({ devices, selectedId, onSelect }: Props) {
  const located = devices.filter((d) => d.lat != null && d.lng != null);
  const selected = located.find((d) => d.id === selectedId);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-view"
      style={{ height: '100%', width: '100%' }}
      preferCanvas={true} // Immensely improves performance with many markers
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToDevice device={selected} />

      {located.map((device) => {
        const isSelected = device.id === selectedId;
        return (
          <Marker
            key={device.id}
            position={[device.lat as number, device.lng as number]}
            icon={getMarkerIcon(device.status, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup>
              <div
                className="map-popup"
                onClick={() => onSelect?.(device)}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <strong>{device.name}</strong>
                <div>{device.status}</div>
                {device.speed != null && <div>{device.speed} km/h</div>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Device } from '../../types/device';

interface FlyToProps {
  device: Device | undefined;
}

function FlyToDevice({ device }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (device?.lat != null && device?.lng != null) {
      map.flyTo([device.lat, device.lng], 15, { animate: true });
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

export function MapView({ devices, selectedId, onSelect }: Props) {
  const located = devices.filter((d) => d.lat != null && d.lng != null);
  const selected = located.find((d) => d.id === selectedId);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-view"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToDevice device={selected} />

      {located.map((device) => (
        <Marker
          key={device.id}
          position={[device.lat as number, device.lng as number]}
          data-selected={device.id === selectedId ? 'true' : undefined}
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
      ))}
    </MapContainer>
  );
}

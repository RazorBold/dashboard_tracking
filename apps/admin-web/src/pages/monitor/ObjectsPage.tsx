import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DeviceListPanel } from '../../components/monitor/DeviceListPanel';
import { MapView } from '../../components/monitor/MapView';
import { DeviceDetailSidebar } from '../../components/monitor/DeviceDetailSidebar';
import { useDevices } from '../../hooks/useDevices';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import type { Device } from '../../types/device';

export function MonitorObjectsPage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();
  const { data, isLoading, isError } = useDevices();

  const { address, loading: addressLoading } = useReverseGeocode(
    selectedDevice?.lat ?? null,
    selectedDevice?.lng ?? null,
  );

  const devices = data?.data ?? [];

  const handleSelect = (device: Device) => {
    setSelectedDevice((prev) => (prev?.id === device.id ? undefined : device));
  };

  return (
    <div className="objects-page">
      {/* Left panel */}
      <aside className="objects-page__panel">
        {isLoading ? (
          <div className="objects-page__loading">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading devices…</span>
          </div>
        ) : isError ? (
          <div className="objects-page__error">Failed to load devices.</div>
        ) : (
          <DeviceListPanel
            devices={devices}
            selectedId={selectedDevice?.id}
            onSelect={handleSelect}
          />
        )}
      </aside>

      {/* Map area */}
      <main className="objects-page__map">
        <MapView
          devices={devices}
          selectedId={selectedDevice?.id}
          onSelect={handleSelect}
        />

        {/* Detail sidebar overlays map on right */}
        <DeviceDetailSidebar
          device={selectedDevice}
          onClose={() => setSelectedDevice(undefined)}
          address={address}
          addressLoading={addressLoading}
        />
      </main>
    </div>
  );
}

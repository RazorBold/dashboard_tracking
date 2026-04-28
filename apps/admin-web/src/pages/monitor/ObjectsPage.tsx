import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DeviceListPanel } from '../../components/monitor/DeviceListPanel';
import { MapView } from '../../components/monitor/MapView';
import { useDevices } from '../../hooks/useDevices';
import type { Device } from '../../types/device';

export function MonitorObjectsPage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();
  const { data, isLoading, isError } = useDevices();

  const devices = data?.data ?? [];

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
            onSelect={setSelectedDevice}
          />
        )}
      </aside>

      {/* Map area */}
      <main className="objects-page__map">
        <MapView
          devices={devices}
          selectedId={selectedDevice?.id}
          onSelect={setSelectedDevice}
        />
      </main>
    </div>
  );
}

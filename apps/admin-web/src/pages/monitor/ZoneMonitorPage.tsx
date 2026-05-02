import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { ZoneListPanel } from '../../components/monitor/ZoneListPanel';
import { ZoneMapView } from '../../components/monitor/ZoneMapView';
import { DeviceDetailSidebar } from '../../components/monitor/DeviceDetailSidebar';
import { useGeofences } from '../../hooks/useGeofences';
import { useDevices } from '../../hooks/useDevices';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { groupDevicesByZone } from '../../utils/geofenceUtils';
import type { Device } from '../../types/device';

export function ZoneMonitorPage() {
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();

  const { data: fences = [], isLoading: fencesLoading } = useGeofences();
  const { data: devicesData, isLoading: devicesLoading } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];

  const { address, loading: addressLoading } = useReverseGeocode(
    selectedDevice?.lat ?? null,
    selectedDevice?.lng ?? null,
  );

  const devicesByZone = useMemo(
    () => groupDevicesByZone(devices, fences),
    [devices, fences],
  );

  const isLoading = fencesLoading || devicesLoading;

  return (
    <div className="objects-page">
      {/* Left panel */}
      <aside className="objects-page__panel">
        {isLoading ? (
          <div className="objects-page__loading">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading zones…</span>
          </div>
        ) : (
          <ZoneListPanel
            fences={fences}
            devicesByZone={devicesByZone}
            selectedFenceId={selectedFenceId}
            onSelect={setSelectedFenceId}
            totalDevices={devices.length}
          />
        )}
      </aside>

      {/* Map */}
      <main className="objects-page__map">
        <ZoneMapView
          fences={fences}
          devices={devices}
          devicesByZone={devicesByZone}
          selectedFenceId={selectedFenceId}
          selectedDeviceId={selectedDevice?.id}
          onSelectDevice={(d) => setSelectedDevice((prev) => prev?.id === d.id ? undefined : d)}
          onDeselectDevice={() => setSelectedDevice(undefined)}
        />

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

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertsListPanel } from '../../components/monitor/AlertsListPanel';
import { AlertDetailPanel } from '../../components/monitor/AlertDetailPanel';
import { MapView } from '../../components/monitor/MapView';
import { useAlerts, useAlertUnreadCount } from '../../hooks/useAlerts';
import { useMarkAlertRead, useMarkAllAlertsRead } from '../../hooks/useAlertMutations';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Alert } from '../../types/alert';
import type { Device } from '../../types/device';

export function MonitorAlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | undefined>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAlerts();
  const { mutate: markRead } = useMarkAlertRead();
  const { mutate: markAllRead } = useMarkAllAlertsRead();
  // Keep unread count synced in store (for sidebar badge + nav bell)
  useAlertUnreadCount();

  // Real-time: prepend new alerts + update unread count
  useWebSocket(useCallback((msg) => {
    if (msg.type === 'NEW_ALERT') {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
    }
  }, [queryClient]));

  const alerts = data?.data ?? [];

  // Derive map devices from alerts that have coordinates
  const alertDevices: Device[] = alerts
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({
      id: a.id,
      name: a.device?.name ?? 'Alert',
      imei: a.device?.imei ?? '',
      status: 'online' as const,
      lat: a.latitude,
      lng: a.longitude,
      createdAt: a.createdAt,
      updatedAt: a.createdAt,
    }));

  // Geocode for detail panel
  const { address, loading: addressLoading } = useReverseGeocode(
    selectedAlert?.latitude ?? null,
    selectedAlert?.longitude ?? null,
  );

  const handleSelect = (alert: Alert) => {
    setSelectedAlert((prev) => (prev?.id === alert.id ? undefined : alert));
  };

  const handleMarkRead = (id: string) => {
    markRead(id);
    // Optimistic update
    setSelectedAlert((prev) => prev?.id === id ? { ...prev, isRead: true } : prev);
  };

  const handleMapSelect = (device: Device) => {
    const match = alerts.find((a) => a.id === device.id);
    if (match) setSelectedAlert(match);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ margin: '-24px' }}>
      {/* Left panel — alert list */}
      <aside className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden">
        <AlertsListPanel
          alerts={alerts}
          isLoading={isLoading}
          selectedId={selectedAlert?.id}
          onSelect={handleSelect}
          onMarkRead={handleMarkRead}
          onMarkAllRead={() => markAllRead()}
        />
      </aside>

      {/* Main — map */}
      <main className="flex-1 relative overflow-hidden">
        <MapView
          devices={alertDevices}
          selectedId={selectedAlert?.id}
          onSelect={handleMapSelect}
        />

        {/* Right overlay — detail panel */}
        {selectedAlert && (
          <div className="absolute top-0 right-0 h-full w-80 shadow-xl z-[800]">
            <AlertDetailPanel
              alert={selectedAlert}
              address={address}
              addressLoading={addressLoading}
              onClose={() => setSelectedAlert(undefined)}
              onMarkRead={handleMarkRead}
            />
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertsListPanel } from '../../components/monitor/AlertsListPanel';
import { AlertDetailPanel } from '../../components/monitor/AlertDetailPanel';
import { AlertMapView } from '../../components/monitor/AlertMapView';
import { useAlerts, useAlertUnreadCount } from '../../hooks/useAlerts';
import { useMarkAlertRead, useMarkAllAlertsRead } from '../../hooks/useAlertMutations';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Alert } from '../../types/alert';

export function MonitorAlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | undefined>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAlerts();
  const { mutate: markRead } = useMarkAlertRead();
  const { mutate: markAllRead } = useMarkAllAlertsRead();
  useAlertUnreadCount();

  useWebSocket(useCallback((msg) => {
    if (msg.type === 'NEW_ALERT') {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
    }
  }, [queryClient]));

  const alerts = data?.data ?? [];

  const { address, loading: addressLoading } = useReverseGeocode(
    selectedAlert?.latitude ?? null,
    selectedAlert?.longitude ?? null,
  );

  const handleSelect = (alert: Alert) => {
    setSelectedAlert((prev) => (prev?.id === alert.id ? undefined : alert));
  };

  const handleMarkRead = (id: string) => {
    markRead(id);
    setSelectedAlert((prev) => prev?.id === id ? { ...prev, isRead: true } : prev);
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
        <AlertMapView
          alerts={alerts}
          selectedId={selectedAlert?.id}
          onSelect={handleSelect}
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

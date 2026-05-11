import { useState, useMemo } from 'react';
import { MultiTrackFilterPanel } from '../../components/monitor/MultiTrackFilterPanel';
import { MultiTrackMapView, TRACK_COLORS } from '../../components/monitor/MultiTrackMapView';
import { useDevices } from '../../hooks/useDevices';
import { useMultiTracks } from '../../hooks/useMultiTracks';

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MonitorMultiTrackPage() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fromInput, setFromInput] = useState(toDatetimeLocal(yesterday));
  const [toInput, setToInput] = useState(toDatetimeLocal(now));
  const [queryParams, setQueryParams] = useState<{ deviceIds: string[]; from: string | null; to: string | null }>({
    deviceIds: [], from: null, to: null,
  });
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [minSatellites, setMinSatellites] = useState(0);

  const { data: devicesData, isLoading: devicesLoading } = useDevices();
  const devices = devicesData?.data ?? [];

  const tracks = useMultiTracks(queryParams);

  const anyLoading = tracks.some((t) => t.isLoading);

  const handleToggleDevice = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSearch = () => {
    setQueryParams({ deviceIds: selectedIds, from: fromInput, to: toInput });
    setVisibleIds(new Set(selectedIds));
  };

  const handleToggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build track layers with filtered positions and assigned colors
  const trackLayers = useMemo(() => {
    return tracks.map((track) => {
      const colorIdx = devices.findIndex((d) => d.id === track.deviceId) % TRACK_COLORS.length;
      const filtered = minSatellites > 0
        ? track.positions.filter((p) => (p.satellites ?? 0) >= minSatellites)
        : track.positions;
      return {
        deviceId: track.deviceId,
        positions: filtered,
        color: TRACK_COLORS[colorIdx < 0 ? 0 : colorIdx],
        visible: visibleIds.has(track.deviceId),
      };
    });
  }, [tracks, visibleIds, minSatellites, devices]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ margin: '-24px' }}>
      {/* Left panel */}
      <aside className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
        <MultiTrackFilterPanel
          devices={devices}
          devicesLoading={devicesLoading}
          selectedIds={selectedIds}
          from={fromInput}
          to={toInput}
          tracks={tracks}
          anyLoading={anyLoading}
          visibleIds={visibleIds}
          minSatellites={minSatellites}
          onToggleDevice={handleToggleDevice}
          onFromChange={setFromInput}
          onToChange={setToInput}
          onSearch={handleSearch}
          onToggleVisible={handleToggleVisible}
          onMinSatellitesChange={setMinSatellites}
        />
      </aside>

      {/* Map */}
      <main className="flex-1 relative overflow-hidden">
        <MultiTrackMapView tracks={trackLayers} />

        {/* Empty state */}
        {queryParams.deviceIds.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl px-8 py-6 text-center shadow-xl border border-slate-200 max-w-xs">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="font-semibold text-slate-700 text-sm">Select devices to compare</p>
              <p className="text-xs text-slate-400 mt-1">Choose one or more devices, set a date range, then click Show Tracks</p>
            </div>
          </div>
        )}

        {/* No data state */}
        {!anyLoading && queryParams.deviceIds.length > 0 && tracks.every((t) => t.positions.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl px-8 py-6 text-center shadow-xl border border-slate-200 max-w-xs">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-slate-700 text-sm">No track data found</p>
              <p className="text-xs text-slate-400 mt-1">No GPS data recorded for this time range. Try a wider date range.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

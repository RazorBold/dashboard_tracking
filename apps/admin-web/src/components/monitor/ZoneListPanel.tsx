import { useState, useMemo } from 'react';
import { Search, Circle as CircleIcon, Pentagon, Navigation } from 'lucide-react';
import type { Geofence, CircleGeometry } from '../../types/geofence';
import type { Device } from '../../types/device';

interface Props {
  fences: Geofence[];
  devicesByZone: Map<string, Device[]>;
  selectedFenceId: string | null;
  onSelect: (id: string | null) => void;
  totalDevices: number;
}

function fmtRadius(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function ZoneListPanel({ fences, devicesByZone, selectedFenceId, onSelect, totalDevices }: Props) {
  const [search, setSearch] = useState('');

  const outsideCount = useMemo(() => {
    const insideIds = new Set<string>();
    devicesByZone.forEach((devs) => devs.forEach((d) => insideIds.add(d.id)));
    return totalDevices - insideIds.size;
  }, [devicesByZone, totalDevices]);

  const filtered = useMemo(
    () =>
      fences.filter((f) =>
        !search || f.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [fences, search],
  );

  return (
    <div className="device-panel">
      {/* Search */}
      <div className="device-panel__search">
        <Search size={14} className="device-panel__search-icon" />
        <input
          className="device-panel__search-input"
          placeholder="Search zones…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Zone list */}
      <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.map((fence) => {
          const devs = devicesByZone.get(fence.id) ?? [];
          const isSelected = fence.id === selectedFenceId;
          const hasDevices = devs.length > 0;

          return (
            <li
              key={fence.id}
              onClick={() => onSelect(isSelected ? null : fence.id)}
              className={`px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                isSelected ? 'bg-primary-50 border-l-2 border-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  {fence.type === 'circle'
                    ? <CircleIcon size={12} className="text-slate-400 flex-shrink-0" />
                    : <Pentagon size={12} className="text-slate-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{fence.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {fence.type === 'circle'
                        ? `Circle · ${fmtRadius((fence.geometry as CircleGeometry).radius)}`
                        : 'Polygon'}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 min-w-[22px] text-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    hasDevices
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {devs.length}
                </span>
              </div>
            </li>
          );
        })}

        {/* Outside all zones row */}
        <li
          onClick={() => onSelect(null)}
          className={`px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
            selectedFenceId === null ? 'bg-primary-50 border-l-2 border-primary-500' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Navigation size={12} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-600">Outside zones</p>
                <p className="text-[11px] text-slate-400">On the road</p>
              </div>
            </div>
            <span className={`flex-shrink-0 min-w-[22px] text-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              outsideCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {outsideCount}
            </span>
          </div>
        </li>
      </ul>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
        <span>{fences.length} zone{fences.length !== 1 ? 's' : ''}</span>
        <span>{totalDevices} vehicle{totalDevices !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

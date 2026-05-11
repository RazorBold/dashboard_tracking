import { useState, useMemo } from 'react';
import { Search, CircleDot, Pentagon, Navigation2 } from 'lucide-react';
import type { Geofence, CircleGeometry } from '../../types/geofence';
import type { Device } from '../../types/device';

// Same palette as ZoneMapView so icon color matches the map ring
const ZONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

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
    () => fences.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase())),
    [fences, search],
  );

  const totalInside = useMemo(() => {
    let n = 0;
    devicesByZone.forEach((devs) => { n += devs.length; });
    return n;
  }, [devicesByZone]);

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
      <div className="zone-panel__list">
        {filtered.map((fence, idx) => {
          const devs = devicesByZone.get(fence.id) ?? [];
          const isSelected = fence.id === selectedFenceId;
          const hasDevices = devs.length > 0;
          const color = ZONE_COLORS[idx % ZONE_COLORS.length];

          return (
            <div
              key={fence.id}
              onClick={() => onSelect(isSelected ? null : fence.id)}
              className={`zone-panel__item${isSelected ? ' zone-panel__item--selected' : ''}`}
            >
              {/* Colored icon */}
              <div
                className="zone-panel__icon-wrap"
                style={{ background: `${color}22`, border: `1.5px solid ${color}55` }}
              >
                {fence.type === 'circle'
                  ? <CircleDot size={15} style={{ color }} />
                  : <Pentagon size={15} style={{ color }} />}
              </div>

              {/* Name + sub-label */}
              <div className="zone-panel__info">
                <p className={`zone-panel__name${!hasDevices ? ' zone-panel__name--muted' : ''}`}>
                  {fence.name}
                </p>
                <p className="zone-panel__sub">
                  {fence.type === 'circle'
                    ? `Circle · ${fmtRadius((fence.geometry as CircleGeometry).radius)}`
                    : 'Polygon'}
                </p>
              </div>

              {/* Vehicle count badge */}
              <span className={`zone-panel__badge ${hasDevices ? 'zone-panel__badge--has' : 'zone-panel__badge--empty'}`}>
                {devs.length}
              </span>
            </div>
          );
        })}

        {/* Divider before outside-zones row */}
        <div className="zone-panel__divider" />

        {/* Outside all zones */}
        <div
          onClick={() => onSelect(null)}
          className={`zone-panel__item${selectedFenceId === null ? ' zone-panel__item--selected' : ''}`}
        >
          <div
            className="zone-panel__icon-wrap"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)' }}
          >
            <Navigation2 size={15} style={{ color: '#fbbf24' }} />
          </div>
          <div className="zone-panel__info">
            <p className="zone-panel__name" style={{ color: '#fbbf24' }}>Outside zones</p>
            <p className="zone-panel__sub">On the road</p>
          </div>
          <span className={`zone-panel__badge ${outsideCount > 0 ? 'zone-panel__badge--outside' : 'zone-panel__badge--empty'}`}>
            {outsideCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="zone-panel__footer">
        <span>{fences.length} zone{fences.length !== 1 ? 's' : ''}</span>
        <span style={{ color: totalInside > 0 ? '#34d399' : undefined }}>
          {totalInside > 0 ? `${totalInside} / ${totalDevices}` : totalDevices} vehicle{totalDevices !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

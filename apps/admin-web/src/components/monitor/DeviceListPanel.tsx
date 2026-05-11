import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Device, DeviceStatus } from '../../types/device';

interface Props {
  devices: Device[];
  selectedId?: string;
  onSelect: (device: Device) => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'inactive';

const STATUS_CLASS: Record<DeviceStatus, string> = {
  online:   'device-panel__badge--online',
  offline:  'device-panel__badge--offline',
  inactive: 'device-panel__badge--inactive',
  expired:  'device-panel__badge--expired',
};

const STATUS_ACCENT: Record<DeviceStatus, string> = {
  online:   '#10b981',
  offline:  '#64748b',
  inactive: '#f59e0b',
  expired:  '#ef4444',
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DeviceListPanel({ devices, selectedId, onSelect }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter === 'online'   && d.status !== 'online')   return false;
      if (statusFilter === 'offline'  && d.status !== 'offline')  return false;
      if (statusFilter === 'inactive' && d.status !== 'inactive') return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.imei.includes(q);
      }
      return true;
    });
  }, [devices, search, statusFilter]);

  const counts = useMemo(() => ({
    online:   devices.filter(d => d.status === 'online').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    offline:  devices.filter(d => d.status === 'offline' || d.status === 'expired').length,
  }), [devices]);

  if (collapsed) {
    return (
      <div className="device-panel device-panel--collapsed">
        <button
          aria-label="Expand panel"
          onClick={() => setCollapsed(false)}
          className="device-panel__toggle"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="device-panel">
      {/* Header */}
      <div className="device-panel__header">
        <span className="device-panel__title">
          Objects
          <span className="device-panel__count">{devices.length}</span>
        </span>
        <button
          aria-label="Collapse panel"
          onClick={() => setCollapsed(true)}
          className="device-panel__toggle"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="device-panel__search">
        <Search size={14} className="device-panel__search-icon" />
        <input
          type="text"
          placeholder="Search name or IMEI…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="device-panel__search-input"
        />
      </div>

      {/* Status filter tabs */}
      <div className="device-panel__tabs" role="group" aria-label="Status filter">
        <button
          onClick={() => setStatusFilter('all')}
          className={`device-panel__tab${statusFilter === 'all' ? ' device-panel__tab--active' : ''}`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('online')}
          className={`device-panel__tab${statusFilter === 'online' ? ' device-panel__tab--active' : ''}`}
        >
          Online{counts.online > 0 && <span className="device-panel__tab-count">{counts.online}</span>}
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`device-panel__tab${statusFilter === 'inactive' ? ' device-panel__tab--active' : ''}`}
        >
          Inactive{counts.inactive > 0 && <span className="device-panel__tab-count device-panel__tab-count--warn">{counts.inactive}</span>}
        </button>
        <button
          onClick={() => setStatusFilter('offline')}
          className={`device-panel__tab${statusFilter === 'offline' ? ' device-panel__tab--active' : ''}`}
        >
          Offline{counts.offline > 0 && <span className="device-panel__tab-count device-panel__tab-count--off">{counts.offline}</span>}
        </button>
      </div>

      {/* Device list */}
      <ul className="device-panel__list">
        {filtered.length === 0 ? (
          <li className="device-panel__empty">No devices found</li>
        ) : (
          filtered.map((device) => {
            const accent = STATUS_ACCENT[device.status];
            const isSelected = selectedId === device.id;
            return (
              <li
                key={device.id}
                className={`device-panel__item${isSelected ? ' device-panel__item--selected' : ''}`}
                style={{ borderLeftColor: accent }}
                onClick={() => onSelect(device)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(device)}
              >
                {/* Row 1: name + status badge */}
                <div className="device-panel__item-header">
                  <span className="device-panel__item-name">{device.name}</span>
                  <span className={`device-panel__badge ${STATUS_CLASS[device.status]}`}>
                    <span className={`device-panel__badge-dot device-panel__badge-dot--${device.status}`} />
                    {device.status}
                  </span>
                </div>

                {/* Row 2: plate + IMEI */}
                <div className="device-panel__item-sub">
                  {device.vehicle?.plateNo
                    ? <span className="device-panel__item-plate">{device.vehicle.plateNo}</span>
                    : null}
                  <span className="device-panel__item-imei">{device.imei}</span>
                </div>

                {/* Row 3: last seen + speed chip */}
                <div className="device-panel__item-meta">
                  <span className="device-panel__item-lastseen">{timeAgo(device.lastOnline)}</span>
                  {device.status === 'online' && device.speed != null && (
                    <span className="device-panel__item-speed-chip">{device.speed} km/h</span>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

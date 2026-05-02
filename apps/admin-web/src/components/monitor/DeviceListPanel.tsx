import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Device, DeviceStatus } from '../../types/device';

interface Props {
  devices: Device[];
  selectedId?: string;
  onSelect: (device: Device) => void;
}

type StatusFilter = 'all' | 'online' | 'offline';

const STATUS_CLASS: Record<DeviceStatus, string> = {
  online: 'device-panel__badge--online',
  offline: 'device-panel__badge--offline',
  inactive: 'device-panel__badge--inactive',
  expired: 'device-panel__badge--expired',
};

export function DeviceListPanel({ devices, selectedId, onSelect }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter === 'online' && d.status !== 'online') return false;
      if (statusFilter === 'offline' && d.status !== 'offline') return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.imei.includes(q);
      }
      return true;
    });
  }, [devices, search, statusFilter]);

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
        {(['all', 'online', 'offline'] as StatusFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`device-panel__tab${statusFilter === tab ? ' device-panel__tab--active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Device list */}
      <ul className="device-panel__list">
        {filtered.length === 0 ? (
          <li className="device-panel__empty">No devices found</li>
        ) : (
          filtered.map((device) => (
            <li
              key={device.id}
              className={`device-panel__item${selectedId === device.id ? ' device-panel__item--selected' : ''}`}
              onClick={() => onSelect(device)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(device)}
            >
              <div className="device-panel__item-header">
                <span className="device-panel__item-name">{device.name}</span>
                <span className={`device-panel__badge ${STATUS_CLASS[device.status]}`}>
                  <span className={`device-panel__badge-dot device-panel__badge-dot--${device.status}`} />
                  {device.status}
                </span>
              </div>
              <div className="device-panel__item-imei">{device.imei}</div>
              {device.speed != null && (
                <div className="device-panel__item-speed">{device.speed} km/h</div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

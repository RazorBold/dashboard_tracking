import { useState } from 'react';
import {
  AlertTriangle, Bell, CheckCheck, Search, X,
  Gauge, ToggleLeft, ChevronDown,
} from 'lucide-react';
import type { Alert, AlertType, AlertSeverity } from '../../types/alert';

const ALERT_TYPE_GROUPS: { label: string; types: AlertType[] }[] = [
  {
    label: 'Driving Behavior',
    types: ['collision', 'sharp_turn_left', 'sharp_turn_right', 'sudden_acceleration', 'sudden_deceleration', 'vibration'],
  },
  { label: 'Speed', types: ['overspeed'] },
  { label: 'ACC / Power', types: ['acc_on', 'acc_off', 'low_battery', 'sos'] },
  { label: 'Geo-fence', types: ['enter_geofence', 'exit_geofence'] },
];

const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  acc_on: 'ACC On',
  acc_off: 'ACC Off',
  vibration: 'Vibration',
  overspeed: 'Overspeed',
  enter_geofence: 'Enter Geo-fence',
  exit_geofence: 'Exit Geo-fence',
  collision: 'Collision',
  sharp_turn_left: 'Sharp Turn Left',
  sharp_turn_right: 'Sharp Turn Right',
  sudden_acceleration: 'Sudden Accel.',
  sudden_deceleration: 'Sudden Decel.',
  low_battery: 'Low Battery',
  sos: 'SOS',
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
};

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  alerts: Alert[];
  isLoading: boolean;
  selectedId?: string;
  onSelect: (alert: Alert) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function AlertsListPanel({ alerts, isLoading, selectedId, onSelect, onMarkRead, onMarkAllRead }: Props) {
  const [search, setSearch] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<AlertType>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');

  const toggleType = (type: AlertType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const filtered = alerts.filter((a) => {
    if (readFilter === 'unread' && a.isRead) return false;
    if (activeTypes.size > 0 && !activeTypes.has(a.type)) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.device?.name.toLowerCase().includes(q) ||
      a.device?.imei.toLowerCase().includes(q) ||
      ALERT_TYPE_LABEL[a.type].toLowerCase().includes(q) ||
      (a.message ?? '').toLowerCase().includes(q)
    );
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="alerts-panel flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="font-semibold text-slate-800 text-sm">Alerts</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 transition-colors"
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>All read</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-primary-400 focus:outline-none transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReadFilter(readFilter === 'all' ? 'unread' : 'all')}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              readFilter === 'unread'
                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {readFilter === 'unread' ? '● Unread only' : 'All'}
          </button>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              activeTypes.size > 0
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Gauge size={11} />
            <span>Type {activeTypes.size > 0 ? `(${activeTypes.size})` : ''}</span>
            <ChevronDown size={11} className={filterOpen ? 'rotate-180' : ''} />
          </button>

          {activeTypes.size > 0 && (
            <button
              onClick={() => setActiveTypes(new Set())}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Type filter dropdown */}
        {filterOpen && (
          <div className="mt-2 border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-2">
            {ALERT_TYPE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.types.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        activeTypes.has(type)
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {ALERT_TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-xs">Loading alerts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <Bell size={28} className="opacity-30" />
            <span className="text-xs">No alerts found</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((alert) => (
              <li key={alert.id}>
                <button
                  onClick={() => onSelect(alert)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group ${
                    selectedId === alert.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                  } ${!alert.isRead ? 'border-l-3 border-l-red-400' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[alert.severity]}`}>
                          {ALERT_TYPE_LABEL[alert.type]}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {alert.device?.name ?? 'Unknown device'}
                      </p>
                      {alert.message && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{alert.message}</p>
                      )}
                    </div>
                    {!alert.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkRead(alert.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200"
                        title="Mark as read"
                      >
                        <ToggleLeft size={14} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { ALERT_TYPE_LABEL };

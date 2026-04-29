import { X, MapPin, Clock, Cpu, Hash, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import type { Alert, AlertSeverity } from '../../types/alert';
import { ALERT_TYPE_LABEL } from './AlertsListPanel';

const SEVERITY_STYLE: Record<AlertSeverity, { badge: string; icon: string }> = {
  info: { badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'text-blue-500' },
  warning: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'text-yellow-500' },
  critical: { badge: 'bg-red-100 text-red-700 border-red-200', icon: 'text-red-500' },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

interface Props {
  alert: Alert;
  address?: string;
  addressLoading?: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export function AlertDetailPanel({ alert, address, addressLoading, onClose, onMarkRead }: Props) {
  const style = SEVERITY_STYLE[alert.severity];

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 animate-fade-in">
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-100 ${alert.severity === 'critical' ? 'bg-red-50' : alert.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className={style.icon} />
            <span className="font-semibold text-slate-800 text-sm truncate">Alert Detail</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
            {alert.severity.toUpperCase()}
          </span>
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            {ALERT_TYPE_LABEL[alert.type]}
          </span>
          {alert.isRead ? (
            <span className="flex items-center gap-1 text-[11px] text-green-600">
              <CheckCircle size={11} /> Read
            </span>
          ) : (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="text-[11px] text-primary-600 hover:underline"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Device */}
        <section>
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Device</h4>
          <div className="space-y-1.5">
            <Row icon={<Cpu size={13} />} label="Name" value={alert.device?.name ?? '—'} />
            <Row icon={<Hash size={13} />} label="IMEI" value={alert.device?.imei ?? '—'} mono />
          </div>
        </section>

        {/* Alert Info */}
        <section>
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Alert Info</h4>
          <div className="space-y-1.5">
            <Row icon={<AlertTriangle size={13} />} label="Type" value={ALERT_TYPE_LABEL[alert.type]} />
            {alert.speed != null && (
              <Row icon={<span className="text-[11px]">⚡</span>} label="Speed" value={`${alert.speed.toFixed(1)} km/h`} />
            )}
            {alert.message && (
              <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 border border-slate-100">
                {alert.message}
              </div>
            )}
          </div>
        </section>

        {/* Location */}
        {(alert.latitude != null && alert.longitude != null) && (
          <section>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Location</h4>
            <div className="space-y-1.5">
              <Row
                icon={<MapPin size={13} />}
                label="Address"
                value={
                  addressLoading
                    ? <span className="flex items-center gap-1 text-slate-400"><Loader2 size={10} className="animate-spin" />Loading…</span>
                    : address ?? `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`
                }
              />
              <Row icon={<span className="text-[11px]">📍</span>} label="Coordinates" value={`${alert.latitude.toFixed(6)}, ${alert.longitude.toFixed(6)}`} mono />
            </div>
          </section>
        )}

        {/* Timestamp */}
        <section>
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Time</h4>
          <Row icon={<Clock size={13} />} label="Triggered" value={formatDateTime(alert.createdAt)} />
          {alert.processedAt && (
            <Row icon={<CheckCircle size={13} />} label="Processed" value={formatDateTime(alert.processedAt)} />
          )}
        </section>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-slate-400 block">{label}</span>
        <span className={`text-xs text-slate-700 break-words ${mono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

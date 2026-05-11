import { useState } from 'react';
import { ShieldAlert, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { useObdDtcs, useClearDtc, useClearAllDtcs } from '../../hooks/useObd';
import type { ObdDtc } from '../../hooks/useObd';
import toast from 'react-hot-toast';

// ─── Severity badge ───────────────────────────────────
const SEV_STYLE: Record<ObdDtc['severity'], { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,.15)',   text: '#f87171', label: 'Critical' },
  warning:  { bg: 'rgba(245,158,11,.15)',  text: '#fbbf24', label: 'Warning'  },
  info:     { bg: 'rgba(59,130,246,.15)',  text: '#60a5fa', label: 'Info'     },
};

function SeverityBadge({ sev }: { sev: ObdDtc['severity'] }) {
  const s = SEV_STYLE[sev];
  return (
    <span className="obd-sev-badge" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function timeAgo(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────
export function OBDFaultCodesPage() {
  const [deviceId,    setDeviceId]    = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: devicesData } = useDevices();
  const devices = devicesData?.data ?? [];

  const { data: dtcs = [], isLoading, refetch } = useObdDtcs(deviceId || null, showHistory);
  const clearOne  = useClearDtc(deviceId);
  const clearAll  = useClearAllDtcs(deviceId);

  const activeDtcs  = dtcs.filter(d => d.status === 'active');
  const criticalCnt = activeDtcs.filter(d => d.severity === 'critical').length;

  const handleClearOne = async (id: string, code: string) => {
    try {
      await clearOne.mutateAsync(id);
      toast.success(`${code} cleared`);
    } catch {
      toast.error('Failed to clear fault');
    }
  };

  const handleClearAll = async () => {
    if (!activeDtcs.length) return;
    try {
      await clearAll.mutateAsync();
      toast.success(`${activeDtcs.length} fault${activeDtcs.length > 1 ? 's' : ''} cleared`);
    } catch {
      toast.error('Failed to clear faults');
    }
  };

  return (
    <div className="obd-page">
      {/* Header */}
      <div className="obd-header">
        <div className="obd-header-left">
          <ShieldAlert size={20} className="obd-header-icon" />
          <h1 className="obd-title">Fault Codes (DTC)</h1>
          {criticalCnt > 0 && (
            <span className="obd-critical-badge">{criticalCnt} Critical</span>
          )}
        </div>
        <div className="obd-header-right">
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="obd-select">
            <option value="">Select device…</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name} · {d.imei}</option>
            ))}
          </select>

          {/* Active / History toggle */}
          <div className="obd-toggle-group">
            <button
              onClick={() => setShowHistory(false)}
              className={`obd-toggle-btn${!showHistory ? ' obd-toggle-btn--active' : ''}`}
            >Active</button>
            <button
              onClick={() => setShowHistory(true)}
              className={`obd-toggle-btn${showHistory ? ' obd-toggle-btn--active' : ''}`}
            >History</button>
          </div>

          <button onClick={() => refetch()} disabled={!deviceId} className="obd-refresh-btn" title="Refresh">
            <RefreshCw size={15} className={isLoading ? 'obd-spin' : ''} />
          </button>

          {!showHistory && activeDtcs.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearAll.isPending}
              className="obd-clear-all-btn"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* No device */}
      {!deviceId && (
        <div className="obd-empty">
          <ShieldAlert size={48} />
          <p>Select a device to view fault codes</p>
        </div>
      )}

      {/* Loading */}
      {deviceId && isLoading && (
        <div className="obd-empty"><span className="obd-spin-lg" />Loading…</div>
      )}

      {/* Empty state */}
      {deviceId && !isLoading && dtcs.length === 0 && (
        <div className="obd-empty">
          <CheckCircle size={48} style={{ color: '#10b981' }} />
          <p style={{ color: '#10b981' }}>No {showHistory ? '' : 'active '}fault codes</p>
          <span>Vehicle diagnostics look healthy</span>
        </div>
      )}

      {/* Table */}
      {deviceId && !isLoading && dtcs.length > 0 && (
        <div className="obd-table-wrap">
          <table className="obd-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
                {showHistory && <th>Cleared</th>}
                {!showHistory && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {dtcs.map((dtc) => (
                <tr key={dtc.id} className={dtc.status === 'active' ? 'obd-row--active' : 'obd-row--cleared'}>
                  <td>
                    <span className="obd-code-badge">{dtc.code}</span>
                  </td>
                  <td className="obd-desc-cell">
                    {dtc.description ?? <span style={{ color: '#475569' }}>No description</span>}
                  </td>
                  <td><SeverityBadge sev={dtc.severity} /></td>
                  <td>
                    <span className={`obd-status-badge obd-status-badge--${dtc.status}`}>
                      {dtc.status === 'active' ? '● Active' : '✓ Cleared'}
                    </span>
                  </td>
                  <td>
                    <span title={new Date(dtc.detectedAt).toLocaleString('id-ID')}>
                      {timeAgo(dtc.detectedAt)}
                    </span>
                  </td>
                  {showHistory && (
                    <td>
                      {dtc.clearedAt
                        ? <span title={new Date(dtc.clearedAt).toLocaleString('id-ID')}>{timeAgo(dtc.clearedAt)}</span>
                        : <span style={{ color: '#475569' }}>—</span>}
                    </td>
                  )}
                  {!showHistory && (
                    <td>
                      {dtc.status === 'active' ? (
                        <button
                          onClick={() => handleClearOne(dtc.id, dtc.code)}
                          disabled={clearOne.isPending}
                          className="obd-clear-btn"
                          title="Mark as cleared"
                        >
                          <CheckCircle size={14} /> Clear
                        </button>
                      ) : (
                        <span style={{ color: '#475569', fontSize: 12 }}>Cleared</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

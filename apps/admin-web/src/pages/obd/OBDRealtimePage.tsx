import { useState } from 'react';
import { RefreshCw, Gauge, AlertTriangle, Wifi } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { useObdLatest, useObdDtcs, n } from '../../hooks/useObd';

// ─── SVG Gauge ────────────────────────────────────────
const CX = 88, CY = 90, R = 68;
const START = 225, SWEEP = 270;

function toXY(deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
}

function arcPath(from: number, to: number): string {
  if (Math.abs(to - from) < 0.01) return '';
  const [sx, sy] = toXY(from);
  const [ex, ey] = toXY(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function gaugeColor(pct: number, inverted: boolean): string {
  if (inverted) {
    if (pct < 0.2) return '#ef4444';
    if (pct < 0.3) return '#f59e0b';
    return '#10b981';
  }
  if (pct >= 0.9)  return '#ef4444';
  if (pct >= 0.75) return '#f59e0b';
  return '#10b981';
}

interface GaugeProps {
  id: string;
  label: string;
  value: number | null;
  min: number;
  max: number;
  unit: string;
  decimals?: number;
  inverted?: boolean;
}

function GaugeCard({ id, label, value, min, max, unit, decimals = 0, inverted = false }: GaugeProps) {
  const pct   = value == null ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const color = value == null ? '#334155' : gaugeColor(pct, inverted);
  const filled = pct > 0;

  const trackPath = arcPath(START, START + SWEEP);
  const valPath   = filled ? arcPath(START, START + pct * SWEEP) : '';

  const filterId = `glow-${id}`;

  return (
    <div className="rtg-card">
      <div className="rtg-accent" style={{ background: value == null ? 'transparent' : color }} />

      <svg width="100%" viewBox="0 0 176 145" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#1a2540"
          strokeWidth={11}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        {valPath && (
          <path
            d={valPath}
            fill="none"
            stroke={color}
            strokeWidth={11}
            strokeLinecap="round"
            filter={`url(#${filterId})`}
          />
        )}

        {/* Value */}
        <text
          x={CX} y={CY - 2}
          textAnchor="middle"
          fill={value == null ? '#334155' : '#f1f5f9'}
          fontSize="34"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {value == null ? '—' : value.toFixed(decimals)}
        </text>

        {/* Unit */}
        <text
          x={CX} y={CY + 20}
          textAnchor="middle"
          fill={value == null ? '#1e293b' : color}
          fontSize="12"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {unit}
        </text>
      </svg>

      <div className="rtg-label">{label}</div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────
function StatCard({ title, rows, accent }: {
  title: string;
  accent?: string;
  rows: { label: string; value: string | number | null; unit?: string }[];
}) {
  return (
    <div className="rtg-stat-card" style={accent ? { borderLeftColor: accent } : {}}>
      <div className="rtg-stat-title">{title}</div>
      {rows.map((r, i) => (
        <div key={i} className="rtg-stat-row">
          <span className="rtg-stat-label">{r.label}</span>
          <span className="rtg-stat-value">
            {r.value == null
              ? <span className="rtg-stat-null">—</span>
              : <>{r.value}{r.unit && <span className="rtg-stat-unit"> {r.unit}</span>}</>
            }
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────
export function OBDRealtimePage() {
  const [deviceId, setDeviceId] = useState<string>('');

  const { data: devicesData } = useDevices();
  const devices = devicesData?.data ?? [];

  const { data: snap, isLoading, isFetching, dataUpdatedAt, refetch } = useObdLatest(deviceId || null);
  const { data: dtcs = [] } = useObdDtcs(deviceId || null);
  const activeDtcs = dtcs.filter(d => d.status === 'active');

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="rtg-page">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="rtg-header">
        <div className="rtg-header-left">
          <Gauge size={18} className="rtg-header-icon" />
          <span className="rtg-header-title">OBD Realtime</span>
          {snap && (
            <span className={`rtg-live-pill${isFetching ? ' rtg-live-pill--pulse' : ''}`}>
              <Wifi size={11} />
              {updatedTime ? `Updated ${updatedTime}` : 'Live'}
            </span>
          )}
        </div>
        <div className="rtg-header-right">
          {activeDtcs.length > 0 && (
            <div className="rtg-fault-pill">
              <AlertTriangle size={12} />
              {activeDtcs.length} Active Fault{activeDtcs.length > 1 ? 's' : ''}
            </div>
          )}
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="rtg-select"
          >
            <option value="">Select device…</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.imei}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            disabled={!deviceId || isLoading}
            className="rtg-refresh-btn"
            title="Refresh now"
          >
            <RefreshCw size={14} className={isFetching ? 'rtg-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Empty ──────────────────────────────────────── */}
      {!deviceId && (
        <div className="rtg-empty">
          <Gauge size={52} />
          <p>Select a device to view OBD diagnostics</p>
          <span>Data refreshes automatically every 10 seconds</span>
        </div>
      )}

      {deviceId && !isLoading && !snap && (
        <div className="rtg-empty">
          <AlertTriangle size={52} />
          <p>No OBD data for this device</p>
          <span>Ensure the device publishes to <code>device/&#123;IMEI&#125;/obd</code></span>
        </div>
      )}

      {/* ── Main layout ────────────────────────────────── */}
      {deviceId && (snap || isLoading) && (
        <div className="rtg-body">

          {/* Gauges 4×2 */}
          <div className="rtg-gauges">
            <GaugeCard id="rpm"    label="Engine RPM"     value={snap?.rpm ?? null}               min={0}  max={8000} unit="RPM"  />
            <GaugeCard id="spd"    label="Vehicle Speed"  value={snap?.vehicleSpeed ?? null}       min={0}  max={200}  unit="km/h" />
            <GaugeCard id="cool"   label="Coolant Temp"   value={snap?.coolantTemp ?? null}        min={0}  max={130}  unit="°C"   />
            <GaugeCard id="fuel"   label="Fuel Level"     value={n(snap?.fuelLevel)}               min={0}  max={100}  unit="%"    decimals={1} inverted />
            <GaugeCard id="load"   label="Engine Load"    value={n(snap?.engineLoad)}              min={0}  max={100}  unit="%"    decimals={1} />
            <GaugeCard id="throt"  label="Throttle"       value={n(snap?.throttle)}                min={0}  max={100}  unit="%"    decimals={1} />
            <GaugeCard id="batt"   label="Battery Voltage" value={n(snap?.batteryVoltage)}         min={10} max={15}   unit="V"    decimals={1} inverted />
            <GaugeCard id="maf"    label="MAF Rate"       value={n(snap?.mafRate)}                 min={0}  max={100}  unit="g/s"  decimals={1} />
          </div>

          {/* Stats row */}
          <div className="rtg-stats">
            <StatCard
              title="Fuel System"
              rows={[
                { label: 'Fuel Pressure',   value: snap?.fuelPressure ?? null,                              unit: 'kPa' },
                { label: 'Short Fuel Trim', value: n(snap?.shortFuelTrim) != null ? n(snap?.shortFuelTrim)!.toFixed(2) : null, unit: '%' },
                { label: 'Long Fuel Trim',  value: n(snap?.longFuelTrim)  != null ? n(snap?.longFuelTrim)!.toFixed(2)  : null, unit: '%' },
                { label: 'O₂ Sensor',       value: n(snap?.o2Voltage)     != null ? n(snap?.o2Voltage)!.toFixed(3)     : null, unit: 'V' },
              ]}
            />
            <StatCard
              title="Engine"
              rows={[
                { label: 'Intake Temp',     value: snap?.intakeTemp ?? null,                                              unit: '°C'    },
                { label: 'Timing Advance',  value: n(snap?.timingAdvance) != null ? n(snap?.timingAdvance)!.toFixed(1) : null, unit: '°BTDC' },
                { label: 'MAF Rate',        value: n(snap?.mafRate)       != null ? n(snap?.mafRate)!.toFixed(2)       : null, unit: 'g/s'   },
                { label: 'Engine Load',     value: n(snap?.engineLoad)    != null ? n(snap?.engineLoad)!.toFixed(1)    : null, unit: '%'     },
              ]}
            />
            <StatCard
              title="Vehicle"
              rows={[
                { label: 'Odometer',     value: snap?.odometer != null ? snap.odometer.toLocaleString('id-ID') : null, unit: 'km' },
                { label: 'IMEI',         value: snap?.imei ?? null },
                { label: 'Last Packet',  value: snap ? new Date(snap.timestamp).toLocaleString('id-ID') : null },
                { label: 'Device ID',    value: deviceId ? `${deviceId.slice(0, 8)}…` : null },
              ]}
            />

            {/* Active Faults */}
            <div className="rtg-faults-card">
              <div className="rtg-stat-title rtg-stat-title--faults">
                <AlertTriangle size={12} />
                Active Faults
                <span className="rtg-faults-count">{activeDtcs.length}</span>
              </div>
              {activeDtcs.length === 0 ? (
                <div className="rtg-faults-ok">
                  <span className="rtg-faults-ok-dot" />
                  All systems nominal
                </div>
              ) : (
                <div className="rtg-faults-list">
                  {activeDtcs.map((dtc) => (
                    <div key={dtc.id} className={`rtg-fault-row rtg-fault-row--${dtc.severity}`}>
                      <span className="rtg-fault-code">{dtc.code}</span>
                      <span className="rtg-fault-sev">{dtc.severity}</span>
                      <span className="rtg-fault-desc">{dtc.description ?? 'Unknown fault'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

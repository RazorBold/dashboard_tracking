import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { BarChart2, Search } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { useObdHistory, n } from '../../hooks/useObd';

// ─── Parameter definitions ────────────────────────────
interface Param {
  key: string;
  label: string;
  unit: string;
  color: string;
  getValue: (s: any) => number | null;
  domain?: [number, number];
}

const PARAMS: Param[] = [
  { key: 'rpm',           label: 'Engine RPM',       unit: 'RPM',    color: '#3b82f6', getValue: (s) => s.rpm,                domain: [0, 8000] },
  { key: 'vehicleSpeed',  label: 'Vehicle Speed',     unit: 'km/h',   color: '#10b981', getValue: (s) => s.vehicleSpeed,       domain: [0, 200] },
  { key: 'coolantTemp',   label: 'Coolant Temp',      unit: '°C',     color: '#ef4444', getValue: (s) => s.coolantTemp,        domain: [0, 130] },
  { key: 'fuelLevel',     label: 'Fuel Level',        unit: '%',      color: '#f59e0b', getValue: (s) => n(s.fuelLevel),       domain: [0, 100] },
  { key: 'engineLoad',    label: 'Engine Load',       unit: '%',      color: '#8b5cf6', getValue: (s) => n(s.engineLoad),      domain: [0, 100] },
  { key: 'throttle',      label: 'Throttle',          unit: '%',      color: '#06b6d4', getValue: (s) => n(s.throttle),        domain: [0, 100] },
  { key: 'batteryVoltage',label: 'Battery Voltage',   unit: 'V',      color: '#22c55e', getValue: (s) => n(s.batteryVoltage),  domain: [3, 4.2] },
  { key: 'mafRate',       label: 'MAF Rate',          unit: 'g/s',    color: '#f97316', getValue: (s) => n(s.mafRate) },
  { key: 'intakeTemp',    label: 'Intake Temp',       unit: '°C',     color: '#ec4899', getValue: (s) => s.intakeTemp },
  { key: 'shortFuelTrim', label: 'Short Fuel Trim',   unit: '%',      color: '#a78bfa', getValue: (s) => n(s.shortFuelTrim) },
  { key: 'longFuelTrim',  label: 'Long Fuel Trim',    unit: '%',      color: '#fb7185', getValue: (s) => n(s.longFuelTrim) },
  { key: 'o2Voltage',     label: 'O₂ Sensor',         unit: 'V',      color: '#34d399', getValue: (s) => n(s.o2Voltage),       domain: [0, 1] },
];

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── Custom tooltip ───────────────────────────────────
function ChartTooltip({ active, payload, label, param }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="obd-tooltip">
      <div className="obd-tooltip-time">{label}</div>
      <div className="obd-tooltip-val" style={{ color: param.color }}>
        {val != null ? `${val} ${param.unit}` : '—'}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────
export function OBDHistoryPage() {
  const now       = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [deviceId,  setDeviceId]  = useState('');
  const [from,      setFrom]      = useState(toDatetimeLocal(yesterday));
  const [to,        setTo]        = useState(toDatetimeLocal(now));
  const [paramKey,  setParamKey]  = useState('rpm');
  const [queried,   setQueried]   = useState<{ deviceId: string; from: string; to: string } | null>(null);

  const { data: devicesData } = useDevices();
  const devices = devicesData?.data ?? [];

  const { data: snapshots = [], isLoading } = useObdHistory(
    queried?.deviceId ?? null,
    queried?.from ?? null,
    queried?.to ?? null,
  );

  const param = PARAMS.find(p => p.key === paramKey) ?? PARAMS[0];

  const chartData = useMemo(() => (
    [...snapshots]
      .reverse()
      .map((s) => ({
        time:  formatTime(s.timestamp),
        value: param.getValue(s),
      }))
      .filter((d) => d.value != null)
  ), [snapshots, param]);

  return (
    <div className="obd-page">
      {/* Header */}
      <div className="obd-header">
        <div className="obd-header-left">
          <BarChart2 size={20} className="obd-header-icon" />
          <h1 className="obd-title">OBD History</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="obd-toolbar">
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="obd-select">
          <option value="">Select device…</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.name} · {d.imei}</option>
          ))}
        </select>

        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="obd-input" />
        <span className="obd-toolbar-sep">→</span>
        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="obd-input" />

        <select value={paramKey} onChange={(e) => setParamKey(e.target.value)} className="obd-select">
          {PARAMS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        <button
          onClick={() => setQueried({
            deviceId,
            from: new Date(from).toISOString(),
            to:   new Date(to).toISOString(),
          })}
          disabled={!deviceId}
          className="obd-search-btn"
        >
          <Search size={14} /> Show
        </button>
      </div>

      {/* Param tabs */}
      <div className="obd-param-tabs">
        {PARAMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setParamKey(p.key)}
            className={`obd-param-tab${paramKey === p.key ? ' obd-param-tab--active' : ''}`}
            style={paramKey === p.key ? { borderColor: p.color, color: p.color } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      {!queried && (
        <div className="obd-empty">
          <BarChart2 size={48} />
          <p>Select a device and time range, then click Show</p>
        </div>
      )}

      {queried && isLoading && (
        <div className="obd-empty"><span className="obd-spin-lg" />Loading…</div>
      )}

      {queried && !isLoading && chartData.length === 0 && (
        <div className="obd-empty">
          <BarChart2 size={48} />
          <p>No data in this time range</p>
        </div>
      )}

      {queried && !isLoading && chartData.length > 0 && (
        <div className="obd-chart-wrap">
          <div className="obd-chart-header">
            <span style={{ color: param.color }}>{param.label}</span>
            <span className="obd-chart-meta">{chartData.length} points</span>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis
                domain={param.domain ?? ['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit={` ${param.unit}`}
                width={70}
              />
              <Tooltip content={<ChartTooltip param={param} />} />
              {param.key === 'batteryVoltage' && (
                <ReferenceLine y={3.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Low', fill: '#f59e0b', fontSize: 11 }} />
              )}
              {param.key === 'coolantTemp' && (
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Hot', fill: '#ef4444', fontSize: 11 }} />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={param.color}
                strokeWidth={2}
                dot={chartData.length < 60 ? { r: 3, fill: param.color } : false}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

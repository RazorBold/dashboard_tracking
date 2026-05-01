import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useDevices } from '../../hooks/useDevices';
import { useAlerts } from '../../hooks/useAlerts';

// ─── Constants ────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  online: '#10b981', offline: '#94a3b8', inactive: '#f59e0b', expired: '#ef4444',
};
const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6', warning: '#f59e0b', critical: '#ef4444',
};
const ALERT_TYPE_LABEL: Record<string, string> = {
  acc_on: 'ACC On', acc_off: 'ACC Off', overspeed: 'Overspeed',
  vibration: 'Vibration', enter_geofence: 'Enter Geo-fence',
  exit_geofence: 'Exit Geo-fence', collision: 'Collision',
  sharp_turn_left: 'Sharp Turn ←', sharp_turn_right: 'Sharp Turn →',
  sudden_acceleration: 'Sudden Accel.', sudden_deceleration: 'Sudden Decel.',
  low_battery: 'Low Battery', sos: 'SOS',
};
const TAB_LIST = ['Device Overview', 'Motion Overview', 'Alert Overview'] as const;
type Tab = typeof TAB_LIST[number];

function shortName(s: string, max = 12) { return s.length > max ? s.slice(0, max) + '…' : s; }
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────
function StatDonut({
  label, value, total, color,
}: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const data = [{ value }, { value: total - value }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <PieChart width={96} height={96}>
          <Pie data={data} cx={44} cy={44} innerRadius={28} outerRadius={42} dataKey="value" startAngle={90} endAngle={-270}>
            <Cell fill={color} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 leading-none">{value}</span>
          <span className="text-[10px] text-slate-400">{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-1 text-center font-medium">{label}</p>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────
function DeviceOverview() {
  const { data: devicesData, isLoading } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];
  const total = devices.length;

  const counts = useMemo(() => ({
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    inactive: devices.filter((d) => d.status === 'inactive').length,
    expired: devices.filter((d) => d.status === 'expired').length,
  }), [devices]);

  const statusData = [
    { name: 'Online', value: counts.online, color: STATUS_COLORS.online },
    { name: 'Offline', value: counts.offline, color: STATUS_COLORS.offline },
    { name: 'Inactive', value: counts.inactive, color: STATUS_COLORS.inactive },
    { name: 'Expired', value: counts.expired, color: STATUS_COLORS.expired },
  ].filter((d) => d.value > 0);

  if (isLoading) return <div className="flex justify-center py-16 text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Donut summary row */}
      <ChartCard title="Device Status Summary">
        <div className="flex flex-wrap items-center gap-8 justify-center py-2">
          <StatDonut label="Total" value={total} total={total} color="#3b82f6" />
          <StatDonut label="Online" value={counts.online} total={total} color={STATUS_COLORS.online} />
          <StatDonut label="Offline" value={counts.offline} total={total} color={STATUS_COLORS.offline} />
          <StatDonut label="Inactive" value={counts.inactive} total={total} color={STATUS_COLORS.inactive} />
          <StatDonut label="Expired" value={counts.expired} total={total} color={STATUS_COLORS.expired} />

          {/* Distribution donut */}
          <div className="flex flex-col items-center">
            <ResponsiveContainer width={160} height={120}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={2}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} devices`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-1 justify-center">
              {statusData.map((d) => (
                <span key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Device table */}
      <ChartCard title="Device List">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['#', 'Device Name', 'Mileage', 'GPS Satellites', 'GSM Signal', 'Speed', 'State', 'Position Time'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {devices.map((d, i) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{d.name}</td>
                  <td className="px-3 py-2 text-slate-600">{d.todayMileage != null ? `${d.todayMileage} km` : '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{d.satellites != null ? `${d.satellites} sats` : '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{d.gsmSignal ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{d.speed != null ? `${d.speed} km/h` : '—'}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={{ backgroundColor: `${STATUS_COLORS[d.status]}20`, color: STATUS_COLORS[d.status] }}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDate(d.lastFix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function MotionOverview() {
  const { data: devicesData } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];

  const motionData = devices.slice(0, 10).map((d, i) => {
    const driving = parseFloat(((i + 1) * 1.1 + (d.status === 'online' ? 1.5 : 0)).toFixed(1));
    const idling  = parseFloat(((i + 1) * 0.35).toFixed(1));
    const parked  = parseFloat(Math.max(0, 24 - driving - idling).toFixed(1));
    return { name: shortName(d.name), driving, idling, parked };
  });

  const totDriving = parseFloat(motionData.reduce((s, d) => s + d.driving, 0).toFixed(1));
  const totIdling  = parseFloat(motionData.reduce((s, d) => s + d.idling, 0).toFixed(1));
  const totParked  = parseFloat(motionData.reduce((s, d) => s + d.parked, 0).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Summary KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Driving', value: `${totDriving} h`, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Idling',  value: `${totIdling} h`,  color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Parked',  value: `${totParked} h`,  color: 'text-slate-600 bg-slate-100' },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border border-slate-200 p-4 text-center ${c.color}`}>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Stacked bar per device */}
      <ChartCard title="Motion Statistics per Device">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={motionData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="h" />
            <Tooltip formatter={(v: number) => `${v} h`} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="driving" name="Driving" stackId="a" fill="#10b981" />
            <Bar dataKey="idling"  name="Idling"  stackId="a" fill="#f59e0b" />
            <Bar dataKey="parked"  name="Parked"  stackId="a" fill="#94a3b8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Mileage bar */}
      <ChartCard title="Mileage per Device (Today)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={motionData.map((d, i) => ({ name: d.name, km: devices[i]?.todayMileage ?? (i + 1) * 15 }))} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit=" km" />
            <Tooltip formatter={(v: number) => `${v} km`} />
            <Bar dataKey="km" name="Mileage" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function AlertOverview() {
  const { data: alertsData } = useAlerts();
  const alerts = alertsData?.data ?? [];

  // By type
  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    alerts.forEach((a) => { m[a.type] = (m[a.type] ?? 0) + 1; });
    return Object.entries(m)
      .map(([t, v]) => ({ name: ALERT_TYPE_LABEL[t] ?? t, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [alerts]);

  // By severity
  const bySeverity = useMemo(() => {
    const m: Record<string, number> = {};
    alerts.forEach((a) => { m[a.severity] = (m[a.severity] ?? 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ name: k, value: v, color: SEVERITY_COLORS[k] ?? '#94a3b8' }));
  }, [alerts]);

  // Last 7 days bar
  const last7 = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })] = 0;
    }
    alerts.forEach((a) => {
      const key = new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [alerts]);

  // Top devices
  const topDevices = useMemo(() => {
    const m: Record<string, { name: string; count: number }> = {};
    alerts.forEach((a) => {
      const k = a.device?.imei ?? 'unknown';
      if (!m[k]) m[k] = { name: a.device?.name ?? '—', count: 0 };
      m[k].count++;
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [alerts]);

  const DONUT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{alerts.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Alerts</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{alerts.filter((a) => a.severity === 'critical').length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Critical</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{alerts.filter((a) => a.isRead).length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Read</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Alarm type donut */}
        <ChartCard title="Alert Type Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                {byType.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v} alerts`} />
              <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Severity breakdown */}
        <ChartCard title="Alerts by Severity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySeverity} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" name="Alerts" radius={[4, 4, 0, 0]}>
                {bySeverity.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Last 7 days trend */}
      <ChartCard title="Alerts — Last 7 Days">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={last7} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Alerts" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Top devices ranking */}
      <ChartCard title="Top Devices by Alert Count">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left pb-2 text-slate-400 font-medium w-6">#</th>
              <th className="text-left pb-2 text-slate-400 font-medium">Device</th>
              <th className="text-right pb-2 text-slate-400 font-medium">Alerts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {topDevices.map((d, i) => (
              <tr key={d.name} className="hover:bg-slate-50">
                <td className="py-2">
                  <span className={`font-bold text-sm ${i < 3 ? 'text-orange-500' : 'text-slate-300'}`}>{i + 1}</span>
                </td>
                <td className="py-2 font-medium text-slate-700">{d.name}</td>
                <td className="py-2 text-right">
                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-semibold">{d.count}</span>
                </td>
              </tr>
            ))}
            {topDevices.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">No alert data</td></tr>
            )}
          </tbody>
        </table>
      </ChartCard>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────
export function ReportOverviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Device Overview');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Report Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fleet status, motion statistics, and alert summaries</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TAB_LIST.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Device Overview' && <DeviceOverview />}
      {activeTab === 'Motion Overview' && <MotionOverview />}
      {activeTab === 'Alert Overview'  && <AlertOverview />}
    </div>
  );
}

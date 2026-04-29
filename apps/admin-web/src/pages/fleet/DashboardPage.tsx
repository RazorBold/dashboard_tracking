import { useState, useMemo } from 'react';
import { Car, Users, Route, Clock, Fuel } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useDevices } from '../../hooks/useDevices';
import { useAlerts } from '../../hooks/useAlerts';

type TimeRange = 'week' | '7d' | '30d';

function getFromDate(range: TimeRange): Date {
  const now = new Date();
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getTime() - (range === '30d' ? 30 : 7) * 86400000);
}

const MOTION_COLORS = ['#10b981', '#f59e0b', '#94a3b8'];
const ALARM_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const REMINDER_COLORS = { Normal: '#10b981', Expiring: '#f59e0b', Expired: '#ef4444' };

const ALERT_TYPE_LABEL: Record<string, string> = {
  acc_on: 'ACC On', acc_off: 'ACC Off', overspeed: 'Overspeed',
  vibration: 'Vibration', enter_geofence: 'Enter Geo-fence',
  exit_geofence: 'Exit Geo-fence', collision: 'Collision',
  sharp_turn_left: 'Sharp Turn Left', sharp_turn_right: 'Sharp Turn Right',
  sudden_acceleration: 'Sudden Accel.', sudden_deceleration: 'Sudden Decel.',
  low_battery: 'Low Battery', sos: 'SOS',
};

function shortName(name: string, max = 10) {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export function FleetDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const { data: devicesData } = useDevices(1, 500);
  const { data: alertsData } = useAlerts();

  const devices = devicesData?.data ?? [];
  const allAlerts = alertsData?.data ?? [];

  const fromDate = getFromDate(timeRange);
  const alerts = allAlerts.filter((a) => new Date(a.createdAt) >= fromDate);

  // KPI stats
  const totalVehicles = devices.length;
  const totalDrivers = Math.max(8, totalVehicles + 3);
  const totalMileage = devices.reduce((s, d) => s + (d.todayMileage ?? 0), 0);
  const drivingTimeH = totalMileage > 0 ? parseFloat((totalMileage / 50).toFixed(1)) : 0;
  const fuelL = totalMileage > 0 ? parseFloat((totalMileage * 0.085).toFixed(1)) : 0;

  // Motion statistics — stacked bar per device (deterministic mock)
  const motionData = devices.slice(0, 8).map((d, i) => {
    const drivingH = parseFloat(((i + 1) * 1.1 + (d.status === 'online' ? 1.5 : 0)).toFixed(1));
    const idlingH = parseFloat(((i + 1) * 0.35).toFixed(1));
    const parkedH = parseFloat(Math.max(0, 24 - drivingH - idlingH).toFixed(1));
    return { name: shortName(d.name), driving: drivingH, idling: idlingH, parked: parkedH };
  });

  // Alarm type ratio — real data from alerts
  const alarmRatioData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => { counts[a.type] = (counts[a.type] ?? 0) + 1; });
    return Object.entries(counts)
      .map(([type, value]) => ({ name: ALERT_TYPE_LABEL[type] ?? type, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [alerts]);

  // Alarm ranking — group by device
  const alarmRanking = useMemo(() => {
    const map: Record<string, { name: string; plate: string; count: number }> = {};
    alerts.forEach((a) => {
      const key = a.device?.imei ?? 'unknown';
      if (!map[key]) {
        map[key] = {
          name: a.device?.name ?? '—',
          plate: a.device?.imei?.slice(-8) ?? key,
          count: 0,
        };
      }
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [alerts]);

  // License / Insurance reminder (mock, scaled to fleet size)
  const n = Math.max(totalVehicles, 5);
  const licenseData: { name: keyof typeof REMINDER_COLORS; value: number }[] = [
    { name: 'Normal', value: Math.round(n * 0.6) },
    { name: 'Expiring', value: Math.round(n * 0.25) },
    { name: 'Expired', value: Math.max(1, Math.round(n * 0.15)) },
  ];
  const insuranceData: { name: keyof typeof REMINDER_COLORS; value: number }[] = [
    { name: 'Normal', value: Math.round(n * 0.7) },
    { name: 'Expiring', value: Math.round(n * 0.2) },
    { name: 'Expired', value: Math.max(1, Math.round(n * 0.1)) },
  ];

  // Mileage per device
  const mileageData = devices.slice(0, 8).map((d, i) => {
    const total = parseFloat((d.todayMileage ?? (i + 1) * 18).toFixed(1));
    return { name: shortName(d.name), total, daily: parseFloat((total / 7).toFixed(1)) };
  });

  // Fuel per device
  const fuelData = mileageData.map((d) => ({
    name: d.name,
    total: parseFloat((d.total * 0.085).toFixed(2)),
    per100km: parseFloat((7.5 + (d.total % 3)).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fleet Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fleet performance overview and statistics</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['week', '7d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r === 'week' ? 'This Week' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard Icon={Car} label="Total Vehicles" value={totalVehicles} color="blue" />
        <KpiCard Icon={Users} label="Total Drivers" value={totalDrivers} color="blue" />
        <KpiCard Icon={Route} label="Distance" value={`${totalMileage.toFixed(0)} km`} color="green" />
        <KpiCard Icon={Clock} label="Driving Time" value={`${drivingTimeH} h`} color="amber" />
        <KpiCard Icon={Fuel} label="Fuel Used" value={`${fuelL} L`} color="red" />
      </div>

      {/* Motion Stats + Alarm Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Motion Statistics" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={motionData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="h" />
              <Tooltip formatter={(v: number) => `${v} h`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="driving" name="Driving" stackId="a" fill={MOTION_COLORS[0]} />
              <Bar dataKey="idling" name="Idling" stackId="a" fill={MOTION_COLORS[1]} />
              <Bar dataKey="parked" name="Parked" stackId="a" fill={MOTION_COLORS[2]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Alarm Type Ratio">
          {alarmRatioData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={alarmRatioData}
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={76}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {alarmRatioData.map((_, i) => (
                    <Cell key={i} fill={ALARM_COLORS[i % ALARM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} alerts`} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No alarm data for this period" />
          )}
        </ChartCard>
      </div>

      {/* Reminders + Alarm Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Reminder Panel">
          <div className="grid grid-cols-2 gap-6">
            <ReminderDonut title="Driving License" data={licenseData} />
            <ReminderDonut title="Insurance" data={insuranceData} />
          </div>
        </ChartCard>

        <ChartCard title="Alarm Statistics Ranking">
          {alarmRanking.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-slate-400 font-medium w-6">#</th>
                  <th className="text-left pb-2 text-slate-400 font-medium">Vehicle</th>
                  <th className="text-left pb-2 text-slate-400 font-medium">IMEI</th>
                  <th className="text-right pb-2 text-slate-400 font-medium">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alarmRanking.map((row, i) => (
                  <tr key={row.plate} className="hover:bg-slate-50">
                    <td className="py-2">
                      <span className={`font-bold text-sm ${i < 3 ? 'text-orange-500' : 'text-slate-300'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2 font-medium text-slate-700">{shortName(row.name, 14)}</td>
                    <td className="py-2 font-mono text-slate-400 text-[10px]">…{row.plate}</td>
                    <td className="py-2 text-right">
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-semibold">{row.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState label="No alarm data for this period" />
          )}
        </ChartCard>
      </div>

      {/* Mileage + Fuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Mileage Statistics">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mileageData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" km" />
              <Tooltip formatter={(v: number) => `${v} km`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="daily" name="Daily Avg" fill="#93c5fd" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fuel Consumption">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fuelData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="Total (L)" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="per100km" name="L / 100 km" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiCard({
  Icon, label, value, color,
}: {
  Icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'amber' | 'red';
}) {
  const styles = {
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red:   'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${styles[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400 font-medium truncate">{label}</div>
        <div className="text-lg font-bold text-slate-800 leading-tight">{value}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ReminderDonut({ title, data }: {
  title: string;
  data: { name: keyof typeof REMINDER_COLORS; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={48}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={REMINDER_COLORS[d.name]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v} (${Math.round((v / total) * 100)}%)`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-1 mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: REMINDER_COLORS[d.name] }} />
              <span className="text-slate-500">{d.name}</span>
            </span>
            <span className="font-semibold text-slate-600">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-sm text-slate-400">{label}</div>
  );
}

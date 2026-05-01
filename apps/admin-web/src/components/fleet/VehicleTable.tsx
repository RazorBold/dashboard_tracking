import { Pencil, Trash2 } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import type { Device } from '../../types/device';

function insuranceBadge(status?: string | null) {
  switch (status) {
    case 'active':        return <span className="badge badge--green">Active</span>;
    case 'expiring_soon': return <span className="badge badge--yellow">Expiring</span>;
    case 'expired':       return <span className="badge badge--red">Expired</span>;
    default:              return <span className="badge badge--gray">None</span>;
  }
}

function insuranceReminder(expiry?: string | null) {
  if (!expiry) return '—';
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days <= 30) return `${days}d left`;
  return '—';
}

function statusBadge(status?: string | null) {
  switch (status) {
    case 'active':      return <span className="badge badge--green">Active</span>;
    case 'inactive':    return <span className="badge badge--gray">Inactive</span>;
    case 'maintenance': return <span className="badge badge--yellow">Maintenance</span>;
    case 'retired':     return <span className="badge badge--red">Retired</span>;
    default:            return <span className="badge badge--gray">—</span>;
  }
}

interface Props {
  vehicles: Vehicle[];
  deviceMap: Map<string, Device>;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}

export function VehicleTable({ vehicles, deviceMap, onEdit, onDelete }: Props) {
  if (vehicles.length === 0) {
    return <div className="device-page__empty"><p>No vehicles found.</p></div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm min-w-[1000px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['#', 'Plate No', 'Type', 'Max Speed', 'Device Name', 'Device IMEI', 'Status', 'Insurance', 'Reminder', 'Action'].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {vehicles.map((v, i) => {
            const device = v.deviceId ? deviceMap.get(v.deviceId) : undefined;
            return (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{v.plateNo}</td>
                <td className="px-3 py-2.5 text-slate-600 capitalize whitespace-nowrap">{v.type ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                  {v.maxSpeed != null ? `${v.maxSpeed} km/h` : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{device?.name ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500 whitespace-nowrap">{device?.imei ?? '—'}</td>
                <td className="px-3 py-2.5">{statusBadge(v.status)}</td>
                <td className="px-3 py-2.5">{insuranceBadge(v.insuranceStatus)}</td>
                <td className="px-3 py-2.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                  {insuranceReminder(v.insuranceExpiry)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1.5 rounded hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(v)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

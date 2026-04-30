import { Pencil, Trash2 } from 'lucide-react';
import type { Driver } from '../../types/driver';

function licenseStatusBadge(expiry?: string | null) {
  if (!expiry) return <span className="badge badge--gray">N/A</span>;
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="badge badge--red">Expired</span>;
  if (days <= 30) return <span className="badge badge--yellow">Expiring</span>;
  return <span className="badge badge--green">Normal</span>;
}

function licenseReminder(expiry?: string | null) {
  if (!expiry) return '—';
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days <= 30) return `${days}d left`;
  return '—';
}

function statusBadge(status: Driver['status']) {
  const map = {
    active: 'badge--green',
    inactive: 'badge--gray',
    suspended: 'badge--red',
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  drivers: Driver[];
  onEdit: (d: Driver) => void;
  onDelete: (d: Driver) => void;
}

export function DriverTable({ drivers, onEdit, onDelete }: Props) {
  if (drivers.length === 0) {
    return (
      <div className="device-page__empty">
        <p>No drivers found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm min-w-[1100px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['#', 'Driver No', 'Name', 'License No', 'RFID', 'KC208', 'Register Place',
              'Register Date', 'Expired Date', 'License Status', 'Reminder', 'Status', 'Fleet', 'Action']
              .map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {drivers.map((d, i) => (
            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2.5 text-slate-400 text-xs">{i + 1}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{d.driverNo}</td>
              <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{d.name}</td>
              <td className="px-3 py-2.5 text-slate-600 text-xs font-mono whitespace-nowrap">{d.licenseNo ?? '—'}</td>
              <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{d.rfidCardNo ?? '—'}</td>
              <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{d.kc208 ?? '—'}</td>
              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{d.registerPlace ?? '—'}</td>
              <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(d.registerDate)}</td>
              <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(d.licenseExpiry)}</td>
              <td className="px-3 py-2.5">{licenseStatusBadge(d.licenseExpiry)}</td>
              <td className="px-3 py-2.5 text-xs font-medium text-slate-600 whitespace-nowrap">{licenseReminder(d.licenseExpiry)}</td>
              <td className="px-3 py-2.5">{statusBadge(d.status)}</td>
              <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{d.fleetName ?? '—'}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(d)}
                    className="p-1.5 rounded hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(d)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

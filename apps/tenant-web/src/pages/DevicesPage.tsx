import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Wifi, WifiOff } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import type { TenantDevice, DeviceStatus, PaginatedMeta } from '../types';

const STATUS_CLASS: Record<DeviceStatus, string> = {
  online: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700',
  offline: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500',
  inactive: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700',
  expired: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600',
};

export function DevicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: TenantDevice[]; meta: PaginatedMeta }>({
    queryKey: ['tenant-devices', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await axiosClient.get(`/devices?${params}`);
      return { data: res.data.data, meta: res.data.meta };
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Devices</h1>
        <p className="text-slate-500 text-sm mt-1">All GPS devices in your organization</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search name or IMEI…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-16 text-slate-400 text-sm">No devices found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'IMEI', 'Model', 'Status', 'Last Online'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.imei}</td>
                  <td className="px-4 py-3 text-slate-500">{d.model ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_CLASS[d.status]}>
                      {d.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {d.lastOnline ? new Date(d.lastOnline).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {data.meta.total} device{data.meta.total !== 1 ? 's' : ''} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs">{page} / {data.meta.totalPages}</span>
            <button
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

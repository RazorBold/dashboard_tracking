import { MonitorSmartphone, Car, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { OrgStats } from '../types';

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | undefined; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        {value === undefined ? (
          <Loader2 size={16} className="animate-spin text-slate-400 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery<OrgStats>({
    queryKey: ['org-stats'],
    queryFn: async () => {
      const res = await axiosClient.get<{ success: boolean; data: OrgStats }>('/users/stats');
      return res.data.data;
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Organization overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={MonitorSmartphone}
          label="Devices"
          value={isLoading ? undefined : data?.devices}
          color="bg-blue-500"
        />
        <StatCard
          icon={Car}
          label="Vehicles"
          value={isLoading ? undefined : data?.vehicles}
          color="bg-indigo-500"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={isLoading ? undefined : data?.users}
          color="bg-violet-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Welcome to your Tenant Portal</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Use the sidebar to navigate between your organization's devices, vehicles, and user accounts.
          As an admin, you can manage sub-accounts and control access for your team members.
        </p>
      </div>
    </div>
  );
}

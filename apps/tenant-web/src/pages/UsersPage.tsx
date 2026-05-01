import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import { useAuthStore } from '../stores/authStore';
import type { TenantUser, UserRole } from '../types';

const ROLE_LABELS: Record<Exclude<UserRole, 'super_admin'>, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

const ROLE_CLASS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  operator: 'bg-yellow-100 text-yellow-700',
  viewer: 'bg-slate-100 text-slate-600',
};

const userSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'operator', 'viewer']),
});
type UserForm = z.infer<typeof userSchema>;

type Mode = 'list' | 'create' | 'edit';

export function UsersPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const { data: users = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: ['org-users'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: TenantUser[] }>('/users');
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'viewer' },
  });

  const openCreate = () => {
    reset({ name: '', email: '', password: '', role: 'viewer' });
    setEditTarget(null);
    setMode('create');
  };

  const openEdit = (user: TenantUser) => {
    reset({ name: user.name, email: user.email, password: '', role: user.role as 'admin' | 'operator' | 'viewer' });
    setEditTarget(user);
    setMode('edit');
  };

  const createMutation = useMutation({
    mutationFn: (data: UserForm) => axiosClient.post('/users', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['org-users'] });
      qc.invalidateQueries({ queryKey: ['org-stats'] });
      setMode('list');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserForm> }) =>
      axiosClient.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['org-users'] });
      setMode('list');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('User removed');
      qc.invalidateQueries({ queryKey: ['org-users'] });
      qc.invalidateQueries({ queryKey: ['org-stats'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to remove user'),
  });

  const onSubmit = (data: UserForm) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else if (mode === 'edit' && editTarget) {
      const payload: Partial<UserForm> = { name: data.name, role: data.role };
      if (data.password) payload.password = data.password;
      updateMutation.mutate({ id: editTarget.id, data: payload });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sub-accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage users in your organization</p>
        </div>
        {isAdmin && mode === 'list' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} /> Add User
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              {mode === 'create' ? 'Add New User' : `Edit — ${editTarget?.name}`}
            </h2>
            <button onClick={() => setMode('list')} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                disabled={mode === 'edit'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="email@company.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {mode === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setMode('list')} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 bg-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 flex items-center gap-2"
              >
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {mode === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : !users.length ? (
          <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
            <UserCheck size={32} className="text-slate-300" />
            <p className="text-sm">No users yet. Add your first team member.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Email', 'Role', 'Last Login', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_CLASS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && u.id !== currentUser?.id && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Remove user?</h3>
            <p className="text-slate-500 text-sm mb-5">
              <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) will be removed from your organization.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60 flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

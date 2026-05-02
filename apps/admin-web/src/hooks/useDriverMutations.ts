import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { DriverFormValues } from '../types/driver';

export function useDriverMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['drivers'] });

  const create = useMutation({
    mutationFn: (payload: DriverFormValues) =>
      axiosClient.post('/drivers', payload).then((r) => r.data),
    onSuccess: () => { toast.success('Driver created'); invalidate(); },
    onError: () => toast.error('Failed to create driver'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DriverFormValues> }) =>
      axiosClient.put(`/drivers/${id}`, payload).then((r) => r.data),
    onSuccess: () => { toast.success('Driver updated'); invalidate(); },
    onError: () => toast.error('Failed to update driver'),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      axiosClient.delete(`/drivers/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Driver deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete driver'),
  });

  const exportCsv = async () => {
    try {
      const { data } = await axiosClient.get('/drivers/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drivers.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return { create, update, remove, exportCsv };
}

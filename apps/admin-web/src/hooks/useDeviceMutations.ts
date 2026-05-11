import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';

interface CreatePayload {
  name: string;
  imei: string;
  model?: string;
}

interface UpdatePayload {
  name?: string;
  model?: string | null;
}

export function useDeviceMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['devices'] });

  const create = useMutation({
    mutationFn: (payload: CreatePayload) =>
      axiosClient.post('/devices', payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Device created');
      invalidate();
    },
    onError: () => toast.error('Failed to create device'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePayload }) =>
      axiosClient.put(`/devices/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Device updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update device'),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      axiosClient.delete(`/devices/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Device deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete device'),
  });

  const exportCsv = async () => {
    try {
      const { data } = await axiosClient.get('/devices/export', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devices.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return { create, update, remove, exportCsv };
}
